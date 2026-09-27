/**
 * Orchestrator.
 *
 *   node --experimental-strip-types scripts/engine/run.mts --mode=verify
 *
 * Modes
 *   seeds     Fetch every seed hub and report which ones are alive. Run this
 *             first, and after any edit to sources.mts. No LLM calls.
 *   links     Daily. HEAD/GET every active application link. No LLM calls.
 *   verify    Weekly. Re-crawl known program URLs, detect changes.
 *   discover  Weekly. Hub crawl + search API, extract anything new.
 *   all       verify + discover.
 *
 * Flags
 *   --limit=N     stop after N extractions (cost control; default 60)
 *   --dry-run     never write programs.ts, still write the queue
 *   --no-search   skip the search API even if a key is present
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PROGRAMS, type Program } from "../../src/data/programs.ts";
import { fetchPage, isSnapshot, hashText } from "./fetch.mts";
import { discover } from "./discover.mts";
import { SEEDS, canonicalUrl, registrableDomain } from "./sources.mts";
import { triage, extract, usage, estimateCostUsd } from "./extract.mts";
import { fingerprint, fingerprintId, findDuplicate, dedupeBatch } from "./dedupe.mts";
import { scoreProposal, decide, diffFields } from "./confidence.mts";
import { checkLinks, checkOne } from "./linkcheck.mts";
import { applyAuto, writeQueue, prBody } from "./sink-git.mts";
import type { Proposal, ExtractedProgram } from "./types.mts";

const STATE_PATH = "data/crawl-state.json";
const REPORT_PATH = "data/engine-report.md";

interface CrawlState {
  [url: string]: { contentHash: string; lastCrawled: string; programId?: string; misses?: number };
}

const argv = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k!, v ?? "true"] as const;
  }),
);
const MODE = argv.get("mode") ?? "verify";
const LIMIT = Number(argv.get("limit") ?? 60);
const DRY = argv.has("dry-run");
const NO_SEARCH = argv.has("no-search");
const TODAY = new Date().toISOString().slice(0, 10);
const RUN_ID = `${TODAY}-${randomUUID().slice(0, 8)}`;

async function loadState(): Promise<CrawlState> {
  try {
    return JSON.parse(await readFile(STATE_PATH, "utf8")) as CrawlState;
  } catch {
    return {};
  }
}
async function saveState(s: CrawlState) {
  await mkdir("data", { recursive: true });
  await writeFile(STATE_PATH, JSON.stringify(s, null, 2) + "\n");
}

/** Fraction of characters that differ, by a cheap length+hash proxy. */
function drift(oldHash: string | undefined, snapshot: { contentHash: string }): number | null {
  if (!oldHash) return null;
  return oldHash === snapshot.contentHash ? 0 : 1;
}

/** Project a catalogue Program into the extractor's field names, for diffing. */
function programAsExtracted(p: Program): Record<string, unknown> {
  return {
    title: p.title,
    organization: p.org,
    category: p.category,
    grade_levels: p.grades,
    app_deadline: p.deadline ?? null,
    app_open_date: p.appOpenDate ?? null,
    program_start_date: p.programStartDate ?? null,
    program_end_date: p.programEndDate ?? null,
    cost_type: p.cost,
    location_type: p.format,
    location_note: p.location,
    application_link: p.url,
    summary: p.summary,
    eligibility: p.eligibility,
  };
}

function extractedAsComparable(e: ExtractedProgram): Record<string, unknown> {
  return {
    title: e.title,
    organization: e.organization,
    category: e.category,
    grade_levels: e.grade_levels.length ? e.grade_levels : undefined,
    app_deadline: e.app_deadline?.value ?? null,
    app_open_date: e.app_open_date?.value ?? null,
    program_start_date: e.program_start_date?.value ?? null,
    program_end_date: e.program_end_date?.value ?? null,
    cost_type: e.cost_note ?? e.cost_type,
    location_type: e.location_type,
    location_note: e.location_note ?? undefined,
    application_link: e.application_link ?? undefined,
    summary: e.summary,
    eligibility: e.eligibility ?? undefined,
  };
}

/* ------------------------------------------------------------ seeds check */

async function runSeeds(): Promise<void> {
  console.log(`Checking ${SEEDS.length} seed sources — no model calls.\n`);
  let alive = 0;
  for (const seed of SEEDS) {
    const page = await fetchPage(seed.url);
    if (isSnapshot(page)) {
      alive++;
      console.log(
        `  OK    ${seed.id.padEnd(22)} ${page.links.length} links, ${page.text.length} chars`,
      );
    } else {
      console.log(`  DEAD  ${seed.id.padEnd(22)} ${page.error}  <- fix or delete in sources.mts`);
    }
  }
  console.log(`\n${alive}/${SEEDS.length} seeds usable.`);
  if (alive < SEEDS.length) process.exitCode = 1;
}

/* ------------------------------------------------------------- link check */

async function runLinks(): Promise<void> {
  const urls = PROGRAMS.map((p) => p.url).filter(Boolean);
  console.log(`Probing ${urls.length} links…`);
  const results = await checkLinks(urls);
  const bad = results.filter((r) => r.verdict === "dead" || r.verdict === "suspect");
  const redirected = results.filter((r) => r.verdict === "redirected");
  console.log(
    `  ok ${results.length - bad.length - redirected.length} · redirected ${redirected.length} · problems ${bad.length}`,
  );
  for (const b of bad)
    console.log(`  ${b.verdict.toUpperCase().padEnd(8)} ${b.status ?? "—"}  ${b.url}`);
  if (results.some((r) => r.verdict === "dead")) process.exitCode = 1;
}

/* ----------------------------------------------------------- crawl a page */

async function processUrl(
  url: string,
  state: CrawlState,
  known: Program[],
  via: string,
): Promise<Proposal | null> {
  const page = await fetchPage(url);

  if (!isSnapshot(page)) {
    const prior = state[url];
    if (prior?.programId && /HTTP 40[0-9]|HTTP 410/.test(page.error)) {
      const program = known.find((p) => p.id === prior.programId);
      return {
        id: prior.programId,
        fingerprint: program
          ? fingerprint({ title: program.title, organization: program.org, url })
          : url,
        url,
        domain: registrableDomain(url),
        contentHash: prior.contentHash,
        fetchedAt: new Date().toISOString(),
        extracted: { title: program?.title ?? url } as ExtractedProgram,
        confidence: { score: 0, band: "low", siteConfidence: "unposted", signals: {} },
        matchedProgramId: prior.programId,
        changes: [],
        disposition: "archive",
        reasons: [
          `Source page returned ${page.error}. Propose archiving; history is preserved for the timeline.`,
        ],
      };
    }
    console.log(`  skip  ${page.error.padEnd(28)} ${url}`);
    return null;
  }

  const prior = state[url];
  if (prior && prior.contentHash === page.contentHash) {
    state[url] = { ...prior, lastCrawled: TODAY };
    console.log(`  same  unchanged                    ${url}`);
    return null;
  }

  // Only spend the cheap model on pages we have not already classified.
  if (!prior) {
    const t = await triage(page);
    if (t.kind !== "program") {
      // Remember the rejection so next week's run does not pay to triage the
      // same staff directory again.
      state[url] = { contentHash: page.contentHash, lastCrawled: TODAY, misses: 1 };
      console.log(`  drop  ${t.kind.padEnd(28)} ${url}`);
      return null;
    }
  }

  const { program, errors, dropped } = await extract(page, TODAY);
  if (!program) {
    console.log(`  fail  extraction returned nothing  ${url}`);
    return null;
  }
  if (dropped.length) program.notes.push(`Validator dropped: ${dropped.join(", ")}.`);

  const linkOk = program.application_link ? await checkOne(program.application_link) : null;
  const confidence = scoreProposal({
    extracted: program,
    status: page.status,
    linkOk,
    textLength: page.text.length,
    drift: drift(prior?.contentHash, page),
    validationErrors: errors.length,
    rendered: page.rendered,
  });

  const match = findDuplicate(
    {
      title: program.title,
      organization: program.organization,
      url: page.finalUrl,
      deadline: program.app_deadline?.value ?? null,
    },
    known.map((p) => ({ ...p, organization: p.org, deadline: p.deadline ?? null })),
  );

  const matchedProgram = match
    ? known.find((p) => p.id === (match.item as unknown as Program).id)
    : undefined;
  const changes = matchedProgram
    ? diffFields(programAsExtracted(matchedProgram), extractedAsComparable(program), confidence)
    : [];

  const decision = decide({
    changes,
    confidence,
    isNew: !matchedProgram,
    pageGone: false,
    probableDuplicate: match?.kind === "probable",
  });

  const fp = fingerprint({
    title: program.title,
    organization: program.organization,
    url: page.finalUrl,
  });
  state[url] = {
    contentHash: page.contentHash,
    lastCrawled: TODAY,
    ...(matchedProgram ? { programId: matchedProgram.id } : {}),
  };

  const reasons = [...decision.reasons, `Found via ${via}.`];
  if (match?.kind === "probable")
    reasons.push(`Possible duplicate of "${matchedProgram?.title}" — ${match.reason}.`);
  if (errors.length) reasons.push(`Validation: ${errors.join("; ")}`);

  console.log(
    `  ${decision.disposition.padEnd(13)} ${String(confidence.score).padStart(3)}/100  ${program.title.slice(0, 48)}`,
  );

  return {
    id: fingerprintId(fp),
    fingerprint: fp,
    url: page.finalUrl,
    domain: page.domain,
    contentHash: page.contentHash,
    fetchedAt: page.fetchedAt,
    extracted: program,
    confidence,
    ...(matchedProgram ? { matchedProgramId: matchedProgram.id } : {}),
    changes,
    disposition: decision.disposition,
    reasons,
  };
}

/* -------------------------------------------------------------- main run */

async function runCrawl(mode: "verify" | "discover" | "all"): Promise<void> {
  if (!process.env["GROQ_API_KEY"]) {
    console.error("GROQ_API_KEY is not set. See docs/DATA-PIPELINE.md §5.");
    process.exitCode = 1;
    return;
  }

  const state = await loadState();
  const known = [...PROGRAMS];
  const knownUrls = new Set(known.map((p) => canonicalUrl(p.url)).filter(Boolean));
  const proposals: Proposal[] = [];
  const discoveryLog: string[] = [];
  let crawled = 0;

  if (mode === "verify" || mode === "all") {
    // Oldest-checked first, so a limited run still makes even progress.
    const targets = known
      .filter((p) => p.url)
      .sort((a, b) =>
        (state[canonicalUrl(a.url)]?.lastCrawled ?? "").localeCompare(
          state[canonicalUrl(b.url)]?.lastCrawled ?? "",
        ),
      )
      .slice(0, LIMIT);
    console.log(`\nVerify pass: ${targets.length} known programs\n`);
    for (const p of targets) {
      crawled++;
      try {
        const proposal = await processUrl(canonicalUrl(p.url), state, known, "catalogue re-crawl");
        if (proposal) proposals.push(proposal);
      } catch (err) {
        // Loop prevention: one program's failure (dead network, exhausted
        // rate-limit retries, a malformed page) never takes down the run. It
        // is logged, surfaces in the PR body, and the next program still gets
        // checked. The program's existing verified data is left untouched.
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ERROR ${p.title} (${canonicalUrl(p.url)}): ${msg}`);
        discoveryLog.push(`Needs verification: "${p.title}" — check failed (${msg}).`);
      }
    }
  }

  if (mode === "discover" || mode === "all") {
    const budget = Math.max(0, LIMIT - crawled);
    console.log(`\nDiscovery pass (budget ${budget})\n`);
    const { candidates, log } = await discover({
      knownUrls,
      useSearch: !NO_SEARCH,
      year: new Date().getFullYear() + 1,
    });
    discoveryLog.push(...log);
    for (const c of candidates.slice(0, budget)) {
      crawled++;
      try {
        const proposal = await processUrl(c.url, state, known, c.via);
        if (proposal) proposals.push(proposal);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ERROR discovered candidate ${c.url}: ${msg}`);
        discoveryLog.push(`Needs verification: candidate ${c.url} — check failed (${msg}).`);
      }
    }
  }

  // Collapse anything the crawl found twice before it reaches a human.
  const { kept, merged } = dedupeBatch(
    proposals.map((p) => ({
      ...p,
      title: p.extracted.title ?? "",
      organization: p.extracted.organization ?? "",
    })),
  );
  if (merged.length)
    discoveryLog.push(`dedupe: collapsed ${merged.length} duplicate candidates within this run`);
  const finalProposals = kept as unknown as Proposal[];

  const apply = DRY ? { applied: [], demoted: [] } : await applyAuto(finalProposals);
  await writeQueue(
    finalProposals.filter((p) => p.disposition !== "unchanged"),
    RUN_ID,
  );
  await saveState(state);

  const deadLinks = finalProposals
    .filter((p) => p.disposition === "archive")
    .map((p) => ({ url: p.url, status: null }));

  const body = prBody({
    runId: RUN_ID,
    proposals: finalProposals,
    apply,
    crawled,
    llmCalls: usage.calls,
    costUsd: estimateCostUsd(),
    discoveryLog,
    deadLinks,
  });
  await writeFile(REPORT_PATH, body);

  const needs = finalProposals.filter((p) => p.disposition === "needs-review").length;
  console.log(
    `\nRun ${RUN_ID}: crawled ${crawled} · ${usage.calls} model calls · ~$${estimateCostUsd().toFixed(2)} · ` +
      `${apply.applied.length} auto-applied · ${needs} queued for review`,
  );
  if (DRY) console.log("(dry run — programs.ts was not written)");
  console.log(`Report: ${REPORT_PATH}`);
}

switch (MODE) {
  case "seeds":
    await runSeeds();
    break;
  case "links":
    await runLinks();
    break;
  case "verify":
  case "discover":
  case "all":
    await runCrawl(MODE);
    break;
  default:
    console.error(`Unknown --mode=${MODE}. Use seeds | links | verify | discover | all.`);
    process.exitCode = 1;
}
