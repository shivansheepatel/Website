/**
 * The sink: git.
 *
 * There is no database in the hot path. A run produces two artifacts:
 *
 *   1. Edits to `src/data/programs.ts` — only the changes the gate cleared for
 *      auto-apply (never a date, never a new listing).
 *   2. `data/review-queue.json` — everything a human has to look at.
 *
 * Both land in one pull request. The PR body is the run report. A counsellor
 * with no database access and no local checkout can read the diff, see exactly
 * which deadline moved and what sentence on what page says so, and approve by
 * clicking Merge. That property is worth more here than a real-time sync.
 *
 * `/admin/review` is the friendlier front door onto the same queue file; its
 * output (`data/review-decisions.json`) is fed back through `applyDecisions`.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import type { Proposal, FieldChange } from "./types.mts";
import {
  readCatalogSource,
  writeCatalogSource,
  scanEntries,
  replaceField,
  renderEntry,
  appendEntries,
  mintId,
} from "./catalog.mts";

export const QUEUE_PATH = "data/review-queue.json";
export const DECISIONS_PATH = "data/review-decisions.json";

export interface QueueFile {
  generatedAt: string;
  runId: string;
  items: Proposal[];
}

/** Map the engine's field names onto the names `Program` actually uses. */
const FIELD_MAP: Record<string, string> = {
  organization: "org",
  app_deadline: "deadline",
  app_open_date: "appOpenDate",
  program_start_date: "programStartDate",
  program_end_date: "programEndDate",
  cost_type: "cost",
  location_type: "format",
  location_note: "location",
  application_link: "url",
  category: "category",
  summary: "summary",
  eligibility: "eligibility",
  grade_levels: "grades",
  title: "title",
};

export function toProgramField(field: string): string {
  return FIELD_MAP[field] ?? field;
}

/* ----------------------------------------------------------- auto-applying */

export interface ApplyReport {
  applied: { id: string; field: string; before: unknown; after: unknown }[];
  demoted: { id: string; field: string; why: string }[];
}

/** Write the cleared changes into programs.ts. Everything else is untouched. */
export async function applyAuto(proposals: Proposal[]): Promise<ApplyReport> {
  const report: ApplyReport = { applied: [], demoted: [] };
  let src = await readCatalogSource();

  for (const p of proposals) {
    if (p.disposition !== "auto-apply" || !p.matchedProgramId) continue;
    for (const change of p.changes) {
      if (!change.autoApplicable) continue;
      const field = toProgramField(change.field);
      // Re-scan each time: every successful edit shifts the offsets after it.
      const span = scanEntries(src).find((s) => s.id === p.matchedProgramId);
      if (!span) {
        report.demoted.push({
          id: p.matchedProgramId,
          field,
          why: "entry not found in programs.ts",
        });
        continue;
      }
      const next = replaceField(src, span, field, change.after);
      if (next == null) {
        report.demoted.push({
          id: p.matchedProgramId,
          field,
          why: "value is multi-line; edit by hand",
        });
        continue;
      }
      src = next;
      report.applied.push({
        id: p.matchedProgramId,
        field,
        before: change.before,
        after: change.after,
      });
    }
    // A successful re-verify always refreshes the checked date.
    const span = scanEntries(src).find((s) => s.id === p.matchedProgramId);
    if (span) {
      const next = replaceField(src, span, "checked", p.fetchedAt.slice(0, 10));
      if (next) src = next;
    }
  }

  if (report.applied.length) await writeCatalogSource(src);
  return report;
}

/* ------------------------------------------------------------------ queue */

export async function writeQueue(items: Proposal[], runId: string): Promise<void> {
  await mkdir("data", { recursive: true });
  const payload: QueueFile = { generatedAt: new Date().toISOString(), runId, items };
  await writeFile(QUEUE_PATH, JSON.stringify(payload, null, 2) + "\n");
}

export async function readQueue(): Promise<QueueFile> {
  try {
    return JSON.parse(await readFile(QUEUE_PATH, "utf8")) as QueueFile;
  } catch {
    return { generatedAt: new Date().toISOString(), runId: "none", items: [] };
  }
}

/* -------------------------------------------------------------- decisions */

export interface Decision {
  proposalId: string;
  action: "approve" | "reject";
  /** Reviewer edits, keyed by the engine's field names. Overrides the extraction. */
  edits?: Record<string, unknown>;
  reviewer?: string;
  decidedAt: string;
}

export interface DecisionsFile {
  decisions: Decision[];
}

/**
 * Apply what a human approved. Runs as its own job so the review step and the
 * crawl never race, and so an approval is always a separate, reviewable commit.
 */
export async function applyDecisions(): Promise<{
  added: string[];
  updated: string[];
  rejected: string[];
}> {
  const queue = await readQueue();
  let decisions: Decision[] = [];
  try {
    decisions =
      (JSON.parse(await readFile(DECISIONS_PATH, "utf8")) as DecisionsFile).decisions ?? [];
  } catch {
    return { added: [], updated: [], rejected: [] };
  }

  let src = await readCatalogSource();
  const taken = new Set(scanEntries(src).map((s) => s.id));
  const added: string[] = [];
  const updated: string[] = [];
  const rejected: string[] = [];
  const newEntries: string[] = [];

  for (const d of decisions) {
    const item = queue.items.find((i) => i.id === d.proposalId);
    if (!item) continue;
    if (d.action === "reject") {
      rejected.push(d.proposalId);
      continue;
    }

    const e = { ...item.extracted, ...(d.edits ?? {}) } as typeof item.extracted &
      Record<string, unknown>;

    if (item.matchedProgramId) {
      for (const change of item.changes) {
        const field = toProgramField(change.field);
        const span = scanEntries(src).find((s) => s.id === item.matchedProgramId);
        if (!span) continue;
        const value = d.edits && field in d.edits ? d.edits[field] : change.after;
        const next = replaceField(src, span, field, value as unknown);
        if (next) src = next;
      }
      updated.push(item.matchedProgramId);
      continue;
    }

    const id = mintId(e.title, e.organization, taken);
    taken.add(id);
    newEntries.push(
      renderEntry({
        id,
        title: e.title,
        org: e.organization,
        category: e.category,
        grades: e.grade_levels.length ? e.grade_levels : [9, 10, 11, 12],
        cost: e.cost_note ?? e.cost_type,
        format: e.location_type,
        location: e.location_note ?? "",
        deadline: e.app_deadline?.value ?? null,
        appOpenDate: e.app_open_date?.value ?? null,
        programStartDate: e.program_start_date?.value ?? null,
        programEndDate: e.program_end_date?.value ?? null,
        confidence: item.confidence.siteConfidence,
        checked: item.fetchedAt.slice(0, 10),
        url: e.application_link ?? item.url,
        sourceUrl: item.url,
        summary: e.summary,
        eligibility: e.eligibility ?? "",
        why: `Added ${item.fetchedAt.slice(0, 10)} from ${item.domain}, reviewed by ${d.reviewer ?? "an admin"}.`,
      }),
    );
    added.push(id);
  }

  if (newEntries.length) src = appendEntries(src, newEntries);
  if (added.length || updated.length) await writeCatalogSource(src);

  // Consume the decisions so the next run does not replay them.
  await writeFile(DECISIONS_PATH, JSON.stringify({ decisions: [] }, null, 2) + "\n");
  return { added, updated, rejected };
}

/* ------------------------------------------------------------- the report */

function describeChange(c: FieldChange): string {
  const fmt = (v: unknown) =>
    v === null || v === "" ? "_(none)_" : "`" + String(v).slice(0, 80) + "`";
  return `${c.field}: ${fmt(c.before)} → ${fmt(c.after)}`;
}

export function prBody(args: {
  runId: string;
  proposals: Proposal[];
  apply: ApplyReport;
  crawled: number;
  llmCalls: number;
  costUsd: number;
  discoveryLog: string[];
  deadLinks: { url: string; status: number | null }[];
}): string {
  const byDisp = (d: Proposal["disposition"]) => args.proposals.filter((p) => p.disposition === d);
  const review = byDisp("needs-review");
  const archive = byDisp("archive");
  const L: string[] = [];

  L.push(`## Data engine run \`${args.runId}\``, "");
  L.push(
    `Crawled **${args.crawled}** pages · **${args.llmCalls}** model calls · ~**$${args.costUsd.toFixed(2)}** · ` +
      `**${args.apply.applied.length}** auto-applied · **${review.length}** need review · ` +
      `**${archive.length}** to archive`,
    "",
  );

  L.push("### Dates in this PR", "");
  L.push(
    "No date in this diff was written by the pipeline. Every date change is in the review queue below,",
    "with the sentence from the source page that supports it. That is by design — see `docs/DATA-PIPELINE.md`.",
    "",
  );

  if (args.apply.applied.length) {
    L.push("### Auto-applied (non-date fields, high confidence)", "");
    for (const a of args.apply.applied) {
      L.push(
        `- \`${a.id}\` — ${a.field}: \`${String(a.before).slice(0, 60)}\` → \`${String(a.after).slice(0, 60)}\``,
      );
    }
    L.push("");
  }

  if (review.length) {
    L.push("### Needs review", "", "Open `/admin/review` locally, or read them here:", "");
    for (const p of review.slice(0, 40)) {
      L.push(
        `<details><summary><strong>${p.extracted.title}</strong> — ${p.extracted.organization} (${p.confidence.score}/100)</summary>`,
        "",
      );
      L.push(`Source: ${p.url}`, "");
      for (const r of p.reasons) L.push(`- ${r}`);
      if (p.changes.length) {
        L.push("", "| field | change |", "| --- | --- |");
        for (const c of p.changes) L.push(`| ${c.field} | ${describeChange(c)} |`);
      }
      const quotes = (
        ["app_open_date", "app_deadline", "program_start_date", "program_end_date"] as const
      )
        .map((f) => [f, p.extracted[f]] as const)
        .filter(([, c]) => c != null);
      if (quotes.length) {
        L.push("", "Evidence:");
        for (const [f, c] of quotes) {
          L.push(`- **${f}** = \`${c!.value}\` (${c!.evidence}) — “${c!.quote.slice(0, 180)}”`);
          // Surfaced right next to the date on purpose: a real, correctly-quoted
          // date that doesn't mean what the field name implies (a school's
          // registration deadline standing in for app_deadline, say) is exactly
          // the kind of mistake that's easy to wave through if it's buried in
          // the free-text notes below instead of sitting next to the value.
          if (c!.caveat) L.push(`  ⚠️ **${c!.caveat}**`);
        }
      }
      if (p.extracted.notes.length) {
        L.push("", "Extractor notes:");
        for (const n of p.extracted.notes) L.push(`- ${n}`);
      }
      L.push("", "</details>", "");
    }
    if (review.length > 40)
      L.push(`_…and ${review.length - 40} more in \`data/review-queue.json\`._`, "");
  }

  if (archive.length) {
    L.push("### Proposed for archive", "");
    for (const p of archive) L.push(`- ${p.extracted.title || p.url} — ${p.reasons.join(" ")}`);
    L.push("");
  }

  if (args.deadLinks.length) {
    L.push("### Link health", "");
    for (const d of args.deadLinks) L.push(`- ${d.url} — ${d.status ?? "no response"}`);
    L.push("");
  }

  L.push(
    "<details><summary>Discovery log</summary>",
    "",
    "```",
    ...args.discoveryLog,
    "```",
    "",
    "</details>",
  );
  return L.join("\n");
}
