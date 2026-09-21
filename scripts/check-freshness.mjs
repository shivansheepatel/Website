#!/usr/bin/env node
/**
 * ============================================================================
 *  FRESHNESS CHECK
 * ============================================================================
 *
 * The problem this solves: a directory of deadlines rots. A program moves its
 * page, changes its date, or quietly stops running, and the site keeps telling
 * students something that is no longer true. That is worse than not listing it.
 *
 * So this runs on a schedule (see .github/workflows/freshness.yml) and reports
 * three kinds of decay:
 *
 *   1. DEAD LINK      — the official page no longer resolves, or returns 4xx/5xx.
 *   2. EXPIRED        — the deadline we show has already passed.
 *   3. STALE          — nobody has verified the listing inside the freshness
 *                       window set in config/site.ts (LIFECYCLE.staleAfterDays).
 *   4. MISSING DATES  — the lifecycle fields (app_open_date, program_start_date,
 *                       program_end_date) that the "Opening soon" and
 *                       "In session" states need. These are reported, never
 *                       invented: the site renders an honest "not published"
 *                       line until a human fills one in from source.
 *
 * WHAT IT DELIBERATELY DOES NOT DO: scrape a new deadline out of the page and
 * write it back. Program pages are unstructured prose, and a scraper that
 * guesses a date confidently is exactly the failure mode we are trying to
 * avoid. This tool raises a hand; a human decides. See docs/DATA-PIPELINE.md
 * for how to graduate to a CMS-backed pipeline if you want automated updates.
 *
 * Usage:
 *   node --experimental-strip-types scripts/check-freshness.mjs
 *   node --experimental-strip-types scripts/check-freshness.mjs --offline
 *   node --experimental-strip-types scripts/check-freshness.mjs --strict
 *
 * Exit codes: 0 always, unless --strict is passed and blocking issues exist.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

const { PROGRAMS, daysUntil } = await import(resolve(ROOT, "src/data/programs.ts"));
const { LIFECYCLE, SITE } = await import(resolve(ROOT, "src/config/site.ts"));

const args = new Set(process.argv.slice(2));
const OFFLINE = args.has("--offline");
const STRICT = args.has("--strict");

const CONCURRENCY = 8;
const TIMEOUT_MS = 15_000;
const USER_AGENT = "Mozilla/5.0 (compatible; StudentOpportunityBot/1.0; +link-health-check-only)";

/* -------------------------------------------------------------------------- */
/*  Link health                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Some organisations reject HEAD outright, so a failed HEAD is retried as a
 * ranged GET before we call a link dead. Being slow to accuse matters here —
 * a false "dead link" issue every week trains maintainers to ignore the report.
 */
async function probe(url) {
  const attempt = async (method) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": USER_AGENT,
          accept: "text/html,application/xhtml+xml",
          ...(method === "GET" ? { range: "bytes=0-2047" } : {}),
        },
      });
      return { status: res.status, finalUrl: res.url };
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    const head = await attempt("HEAD");
    if (head.status < 400) return { ok: true, ...head };
    const get = await attempt("GET");
    return { ok: get.status < 400, ...get };
  } catch (error) {
    try {
      const get = await attempt("GET");
      return { ok: get.status < 400, ...get };
    } catch (second) {
      return { ok: false, status: 0, error: String(second?.message ?? second) };
    }
  }
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

/* -------------------------------------------------------------------------- */
/*  Checks                                                                     */
/* -------------------------------------------------------------------------- */

const now = new Date();

function daysSince(iso) {
  const then = new Date(`${iso}T12:00:00Z`).getTime();
  if (Number.isNaN(then)) return Infinity;
  return Math.floor((now.getTime() - then) / 86_400_000);
}

const issues = [];
const add = (program, kind, severity, detail) =>
  issues.push({
    id: program.id,
    title: program.title,
    org: program.org,
    url: program.url,
    kind,
    severity,
    detail,
  });

// --- deadline + staleness (no network needed) ---
for (const p of PROGRAMS) {
  const left = daysUntil(p.deadline, now);

  if (left !== null && left < 0) {
    add(
      p,
      "expired",
      p.confidence === "confirmed" ? "high" : "medium",
      `Deadline ${p.deadline} passed ${Math.abs(left)} day(s) ago (marked "${p.confidence}"). Roll it forward to the next cycle or mark it unposted.`,
    );
  }

  const age = daysSince(p.lastChecked);
  if (age > LIFECYCLE.staleAfterDays) {
    add(
      p,
      "stale",
      age > LIFECYCLE.staleAfterDays * 2 ? "medium" : "low",
      `Last verified ${age} days ago; the freshness window is ${LIFECYCLE.staleAfterDays} days.`,
    );
  }

  if (p.deadline === null && p.confidence !== "unposted") {
    add(p, "schema", "low", `No deadline set but confidence is "${p.confidence}".`);
  }

  // --- lifecycle coverage -------------------------------------------------
  // Not an error: most organisers publish only a closing date. This is a
  // worklist, sorted so the listings a student is most likely to hit come
  // first — an open program without an open date is more annoying than a
  // closed one.
  const missing = [];
  if (!p.appOpenDate) missing.push("app_open_date");
  if (!p.programStartDate) missing.push("program_start_date");
  if (!p.programEndDate) missing.push("program_end_date");
  if (missing.length > 0) {
    add(
      p,
      "missing-dates",
      left !== null && left >= 0 ? "low" : "info",
      `Missing ${missing.join(", ")} — the lifecycle view falls back to an honest "not published" line.`,
    );
  }

  // --- date ordering ------------------------------------------------------
  const order = [
    ["app_open_date", p.appOpenDate],
    ["app_deadline", p.deadline],
    ["program_start_date", p.programStartDate],
    ["program_end_date", p.programEndDate],
  ].filter(([, v]) => Boolean(v));
  for (let i = 1; i < order.length; i += 1) {
    const prev = order[i - 1];
    const cur = order[i];
    if (String(cur[1]) < String(prev[1])) {
      add(p, "schema", "medium", `${cur[0]} (${cur[1]}) is before ${prev[0]} (${prev[1]}).`);
    }
  }
}

// --- link health ---
let probes = [];
if (!OFFLINE) {
  process.stderr.write(`Probing ${PROGRAMS.length} URLs (${CONCURRENCY} at a time)…\n`);
  probes = await mapLimit(PROGRAMS, CONCURRENCY, async (p) => {
    const result = await probe(p.url);
    if (!result.ok) {
      add(
        p,
        "dead-link",
        result.status === 404 || result.status === 0 ? "high" : "medium",
        result.status
          ? `HTTP ${result.status} from ${p.url}`
          : `Request failed: ${result.error ?? "unknown error"}`,
      );
    }
    return { id: p.id, url: p.url, ...result };
  });
} else {
  process.stderr.write("Offline mode — skipping link probes.\n");
}

/* -------------------------------------------------------------------------- */
/*  Report                                                                     */
/* -------------------------------------------------------------------------- */

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2, info: 3 };
issues.sort(
  (a, b) =>
    SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.title.localeCompare(b.title),
);

const byKind = (kind) => issues.filter((i) => i.kind === kind);

/**
 * "Missing lifecycle dates" is a worklist, not a fault — it stays out of the
 * actionable count so the tracking issue closes when the real problems are
 * fixed, instead of sitting open forever against data organisers never
 * published.
 */
const actionable = issues.filter((i) => i.kind !== "missing-dates").length;

const report = {
  site: SITE.name,
  generatedAt: now.toISOString(),
  offline: OFFLINE,
  totals: {
    programs: PROGRAMS.length,
    checked: probes.length,
    issues: issues.length,
    actionable,
    deadLinks: byKind("dead-link").length,
    expired: byKind("expired").length,
    stale: byKind("stale").length,
    schema: byKind("schema").length,
    missingDates: byKind("missing-dates").length,
    lifecycleCoverage: {
      appOpenDate: PROGRAMS.filter((p) => p.appOpenDate).length,
      programStartDate: PROGRAMS.filter((p) => p.programStartDate).length,
      programEndDate: PROGRAMS.filter((p) => p.programEndDate).length,
      of: PROGRAMS.length,
    },
  },
  issues,
};

await mkdir(resolve(ROOT, "data"), { recursive: true });
await writeFile(
  resolve(ROOT, "data/freshness-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);

const KIND_TITLE = {
  "dead-link": "Dead or unreachable links",
  expired: "Deadlines that have passed",
  stale: "Listings past the freshness window",
  schema: "Data inconsistencies",
  "missing-dates": "Listings without full lifecycle dates",
};

const lines = [
  `## Freshness report — ${report.generatedAt.slice(0, 10)}`,
  "",
  report.totals.actionable === 0
    ? `${report.totals.programs} listings checked. **Nothing is broken.**`
    : `${report.totals.programs} listings checked. **${report.totals.actionable} need attention**, plus ${report.totals.missingDates} with incomplete lifecycle dates.`,
  "",
  `| Dead links | Expired | Stale | Schema | Missing dates |`,
  `| --- | --- | --- | --- | --- |`,
  `| ${report.totals.deadLinks} | ${report.totals.expired} | ${report.totals.stale} | ${report.totals.schema} | ${report.totals.missingDates} |`,
  "",
  "### Lifecycle date coverage",
  "",
  `| Field | Populated |`,
  `| --- | --- |`,
  `| \`app_open_date\` | ${report.totals.lifecycleCoverage.appOpenDate} / ${report.totals.lifecycleCoverage.of} |`,
  `| \`program_start_date\` | ${report.totals.lifecycleCoverage.programStartDate} / ${report.totals.lifecycleCoverage.of} |`,
  `| \`program_end_date\` | ${report.totals.lifecycleCoverage.programEndDate} / ${report.totals.lifecycleCoverage.of} |`,
  "",
  "Coverage below 100% is expected — most organisers publish only a closing",
  "date. Fill these in from source as you verify listings; never estimate one.",
  "",
];

for (const kind of ["dead-link", "expired", "stale", "schema", "missing-dates"]) {
  const group = byKind(kind);
  if (group.length === 0) continue;
  lines.push(`### ${KIND_TITLE[kind]} (${group.length})`, "");
  for (const i of group.slice(0, 40)) {
    lines.push(`- **${i.title}** — ${i.detail} ([source](${i.url}))`);
  }
  if (group.length > 40) lines.push(`- …and ${group.length - 40} more, see the JSON artifact.`);
  lines.push("");
}

if (issues.length === 0) lines.push("Everything is current. No action needed.", "");

const markdown = lines.join("\n");
await writeFile(resolve(ROOT, "data/freshness-report.md"), `${markdown}\n`, "utf8");
process.stdout.write(`${markdown}\n`);

const blocking = issues.filter((i) => i.severity === "high").length;
process.stderr.write(
  `\n${actionable} actionable issue(s), ${blocking} high severity, ${report.totals.missingDates} listing(s) with incomplete lifecycle dates.\n`,
);

if (STRICT && blocking > 0) process.exit(1);
