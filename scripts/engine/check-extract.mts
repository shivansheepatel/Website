/**
 * Offline test for the data engine.
 *
 *   node --experimental-strip-types scripts/engine/check-extract.mts
 *
 * No network, no API key, no cost. It exercises the parts that decide whether
 * a wrong date can reach a student: quote validation, the confidence gate, the
 * dedupe fingerprint, and the programs.ts surgical editor.
 *
 * With ANTHROPIC_API_KEY set and --live, it additionally runs one real
 * extraction against the bundled fixture and asserts the model found the dates
 * a human can see on it. That is the test that catches a prompt regression.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as cheerio from "cheerio";
import { validate, EXTRACT_TOOL } from "./extract.mts";
import {
  scoreProposal,
  decide,
  diffFields,
  siteConfidenceFor,
  NEVER_AUTO,
  isAutoApplicable,
} from "./confidence.mts";
import { fingerprint, normalizeTitle, normalizeOrg, findDuplicate, similarity } from "./dedupe.mts";
import { registrableDomain, canonicalUrl, crawlable } from "./sources.mts";
import { scanEntries, replaceField, renderEntry, appendEntries, mintId } from "./catalog.mts";
import { hashText } from "./fetch.mts";
import type { ExtractedProgram, Claim } from "./types.mts";

const HERE = dirname(fileURLToPath(import.meta.url));
let passed = 0;
const failures: string[] = [];

function ok(label: string, cond: boolean, detail = "") {
  if (cond) passed++;
  else failures.push(`${label}${detail ? " — " + detail : ""}`);
}
function eq(label: string, actual: unknown, expected: unknown) {
  ok(
    label,
    JSON.stringify(actual) === JSON.stringify(expected),
    `got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`,
  );
}

/* ------------------------------------------------------------- fixtures */

const html = await readFile(join(HERE, "fixtures", "summer-academy.html"), "utf8");
const $ = cheerio.load(html);
$("script, style, nav, footer").remove();
const pageText = $("body")
  .text()
  .replace(/[ \t ]+/g, " ")
  .replace(/ ?\n ?/g, "\n")
  .trim();
const page = { text: pageText, url: "https://example-polytechnic.test/summer-engineering-academy" };

const claim = (
  value: string,
  evidence: Claim<string>["evidence"],
  quote: string,
): Claim<string> => ({ value, evidence, quote });

function baseExtraction(): ExtractedProgram {
  return {
    title: "Summer Engineering Academy",
    organization: "Example Polytechnic",
    category: "Engineering summer program",
    grade_levels: [11, 12],
    app_open_date: claim("2027-01-12", "structured", "Applications open January 12, 2027"),
    app_deadline: claim("2027-03-01", "labelled", "Application deadline: March 1, 2027"),
    program_start_date: claim("2027-07-05", "structured", "The academy runs July 5 – 30, 2027"),
    program_end_date: claim("2027-07-30", "structured", "The academy runs July 5 – 30, 2027"),
    cost_type: "Need-Based Aid",
    cost_note: "$1,850 CAD, bursaries available",
    location_type: "In-Person",
    location_note: "Example Polytechnic campus",
    essay_prompts: [
      "Describe a problem in your community that you think engineering could help with.",
    ],
    required_documents: ["Most recent report card", "One reference letter from a teacher"],
    application_link: "https://apply.example-polytechnic.test/sea-2027",
    summary: "A four-week residential engineering program with a team design challenge.",
    eligibility: "Students entering grade 11 or 12 in September 2027, resident in Ontario.",
    rolling: false,
    not_a_program: false,
    notes: [],
  };
}

/* ------------------------------------------------------ 1. quote validation */

{
  const good = baseExtraction();
  const r = validate(good, page);
  ok("clean extraction validates", r.ok, r.errors.join("; "));
}
{
  // The failure mode this whole design exists to catch: a plausible date with
  // a quote that is not on the page.
  const bad = baseExtraction();
  bad.app_deadline = claim("2027-02-15", "labelled", "Application deadline: February 15, 2027");
  const r = validate(bad, page);
  ok("invented deadline is rejected", !r.ok && r.errors.some((e) => e.startsWith("app_deadline")));
}
{
  // Real quote, wrong date attached to it.
  const bad = baseExtraction();
  bad.app_deadline = claim("2027-04-01", "labelled", "Application deadline: March 1, 2027");
  const r = validate(bad, page);
  ok("real quote with mismatched date is rejected", !r.ok);
}
{
  const bad = baseExtraction();
  bad.app_deadline = claim("2027-02-31", "labelled", "Application deadline: March 1, 2027");
  const r = validate(bad, page);
  ok("impossible calendar date is rejected", !r.ok);
}
{
  const inferred = baseExtraction();
  inferred.app_deadline = claim("2027-03-01", "inferred", "Application deadline: March 1, 2027");
  const r = validate(inferred, page);
  ok(
    "inferred date is dropped, not published",
    inferred.app_deadline === null && r.dropped.length > 0,
  );
}
{
  const contradictory = baseExtraction();
  contradictory.app_open_date = claim(
    "2027-06-01",
    "labelled",
    "Applications open January 12, 2027",
  );
  const r = validate(contradictory, page);
  // The quote does not contain June 1, so this is caught as a mismatch.
  ok("open-after-deadline contradiction is surfaced", !r.ok || contradictory.notes.length > 0);
}
{
  const whitespace = baseExtraction();
  whitespace.app_deadline = claim(
    "2027-03-01",
    "labelled",
    "Application    deadline:  March 1,\n2027",
  );
  const r = validate(whitespace, page);
  ok("whitespace differences do not fail a real quote", r.ok, r.errors.join("; "));
}

/* ------------------------------------------------- 2. confidence + the gate */

const cleanConf = scoreProposal({
  extracted: baseExtraction(),
  status: 200,
  linkOk: true,
  textLength: pageText.length,
  drift: null,
  validationErrors: 0,
  rendered: false,
});
ok("a well-evidenced page scores high", cleanConf.band === "high", `score ${cleanConf.score}`);
eq("structured+labelled deadline maps to confirmed", cleanConf.siteConfidence, "confirmed");

{
  const prose = baseExtraction();
  prose.app_deadline = claim(
    "2027-03-01",
    "prose",
    "we begin reviewing applications after March 1, 2027",
  );
  eq("a deadline read from prose is only ever estimated", siteConfidenceFor(prose), "estimated");
}
{
  const none = baseExtraction();
  none.app_deadline = null;
  eq("no deadline means unposted, never a guess", siteConfidenceFor(none), "unposted");
  const c = scoreProposal({
    extracted: none,
    status: 200,
    linkOk: true,
    textLength: pageText.length,
    drift: null,
    validationErrors: 0,
    rendered: false,
  });
  ok(
    "a missing date lowers the score",
    c.score < cleanConf.score,
    `${c.score} vs ${cleanConf.score}`,
  );

  const allNull = {
    ...baseExtraction(),
    app_open_date: null,
    app_deadline: null,
    program_start_date: null,
    program_end_date: null,
  };
  const cNone = scoreProposal({
    extracted: allNull,
    status: 200,
    linkOk: true,
    textLength: pageText.length,
    drift: null,
    validationErrors: 0,
    rendered: false,
  });
  ok(
    "no dates at all scores well below a dated page",
    cNone.score < cleanConf.score - 20,
    `${cNone.score} vs ${cleanConf.score}`,
  );
}
{
  const deadLink = scoreProposal({
    extracted: baseExtraction(),
    status: 200,
    linkOk: false,
    textLength: 4000,
    drift: null,
    validationErrors: 0,
    rendered: false,
  });
  ok(
    "a dead application link tanks confidence",
    deadLink.band !== "high",
    `score ${deadLink.score}`,
  );
}

// The central rule of this build.
for (const f of ["app_deadline", "app_open_date", "program_start_date", "program_end_date"]) {
  ok(`${f} can never auto-apply`, !isAutoApplicable(f, cleanConf) && NEVER_AUTO.has(f));
}
ok("summary can auto-apply at high confidence", isAutoApplicable("summary", cleanConf));
ok(
  "summary cannot auto-apply at low confidence",
  !isAutoApplicable("summary", { ...cleanConf, band: "low" }),
);

{
  const changes = diffFields(
    { app_deadline: "2027-03-01", summary: "old text" },
    { app_deadline: "2027-03-15", summary: "new text" },
    cleanConf,
  );
  const d = decide({
    changes,
    confidence: cleanConf,
    isNew: false,
    pageGone: false,
    probableDuplicate: false,
  });
  eq("a moved deadline goes to review even at 100 confidence", d.disposition, "needs-review");
  ok("the reviewer is told which date moved", d.reasons.join(" ").includes("2027-03-15"));
}
{
  const changes = diffFields({ summary: "old" }, { summary: "new" }, cleanConf);
  const d = decide({
    changes,
    confidence: cleanConf,
    isNew: false,
    pageGone: false,
    probableDuplicate: false,
  });
  eq("a prose-only change at high confidence auto-applies", d.disposition, "auto-apply");
}
{
  const d = decide({
    changes: [],
    confidence: cleanConf,
    isNew: true,
    pageGone: false,
    probableDuplicate: false,
  });
  eq("every new listing is seen by a human once", d.disposition, "needs-review");
}
{
  const d = decide({
    changes: [],
    confidence: cleanConf,
    isNew: false,
    pageGone: true,
    probableDuplicate: false,
  });
  eq("a gone page is proposed for archive", d.disposition, "archive");
}
{
  // Absence of evidence must not delete data we already have.
  const changes = diffFields({ eligibility: "Grades 11-12" }, { eligibility: null }, cleanConf);
  eq("the extractor cannot blank an existing field", changes.length, 0);
}

/* ------------------------------------------------------------- 3. dedupe */

eq(
  "title normalisation strips edition noise",
  normalizeTitle("23rd Annual Summer Engineering Academy 2027"),
  normalizeTitle("Engineering Academy"),
);
eq(
  "org normalisation strips institutional words",
  normalizeOrg("University of Waterloo"),
  normalizeOrg("Waterloo"),
);

const fpA = fingerprint({
  title: "Summer Engineering Academy",
  organization: "Example Polytechnic",
  url: "https://www.example-polytechnic.test/a",
});
const fpB = fingerprint({
  title: "Engineering Academy (Summer 2027)",
  organization: "Example Polytechnic",
  url: "https://apply.example-polytechnic.test/b",
});
eq("same program across subdomains fingerprints identically", fpA, fpB);

const fpOther = fingerprint({
  title: "Summer Engineering Academy",
  organization: "Different University",
  url: "https://other.test/a",
});
ok("different organisations do not collide", fpA !== fpOther);

{
  const existing = [
    {
      id: "x",
      title: "Summer Engineering Academy",
      organization: "Example Polytechnic",
      url: "https://example-polytechnic.test/sea",
      deadline: null,
    },
  ];
  const exact = findDuplicate(
    {
      title: "Engineering Academy Summer",
      organization: "Example Polytechnic",
      url: "https://example-polytechnic.test/sea-2027",
    },
    existing,
  );
  eq("exact fingerprint match is detected", exact?.kind, "exact");

  const probable = findDuplicate(
    {
      title: "Summer Engineering Academy (Residential Stream)",
      organization: "Example Polytechnic",
      url: "https://example-polytechnic.test/sea-res",
    },
    existing,
  );
  ok(
    "a re-titled program is flagged as probable, never merged silently",
    probable?.kind === "probable",
  );

  // Worth being clear about the limit: a heavier rename ("Academy" ->
  // "Institute") falls below the similarity floor and comes through as a NEW
  // listing. That is the safe direction to fail — a new listing still goes to
  // a human, who can spot the duplicate. Merging it automatically would hide
  // a real program from students if the guess were wrong.
  const heavyRename = findDuplicate(
    {
      title: "Summer Engineering Institute",
      organization: "Example Polytechnic",
      url: "https://example-polytechnic.test/sei",
    },
    existing,
  );
  ok(
    "a heavy rename degrades to 'new listing', not a silent merge",
    heavyRename === null || heavyRename.kind === "probable",
  );

  const unrelated = findDuplicate(
    {
      title: "Creative Writing Workshop",
      organization: "Example Polytechnic",
      url: "https://example-polytechnic.test/cw",
    },
    existing,
  );
  eq("an unrelated program is not a duplicate", unrelated, null);
}
ok("similarity is bounded", similarity("abc", "abc") === 1 && similarity("abc", "xyz") < 0.2);

/* -------------------------------------------------------------- 4. urls */

eq(
  "registrable domain handles .on.ca",
  registrableDomain("https://sub.board.on.ca/x"),
  "board.on.ca",
);
eq(
  "registrable domain handles .com",
  registrableDomain("https://www.a.b.example.com/x"),
  "example.com",
);
eq(
  "canonical url strips trackers",
  canonicalUrl("https://WWW.Example.test/a/?utm_source=x&id=3#frag"),
  "https://example.test/a?id=3",
);
ok("search engines are never crawled", !crawlable("https://www.google.com/search?q=x"));
ok("pdfs are skipped", !crawlable("https://example.test/brochure.pdf"));
ok("a real program url is crawlable", crawlable("https://example.test/summer-academy"));

/* ---------------------------------------------------- 5. catalog editing */

const SAMPLE = `import type { X } from "./x";

export const PROGRAMS: Program[] = [
  {
    id: "alpha",
    title: "Alpha Program",
    org: "Alpha Org",
    deadline: "2027-01-01",
    summary: "Old summary.",
    grades: [11, 12],
  },
  {
    id: "beta",
    title: "Beta { not a brace } Program",
    org: "Beta Org",
    deadline: null,
    summary: "Beta summary.",
  },
];
`;

{
  const spans = scanEntries(SAMPLE);
  eq(
    "scanner finds both entries",
    spans.map((s) => s.id),
    ["alpha", "beta"],
  );
  ok("scanner is not fooled by braces inside strings", spans[1]!.source.includes("not a brace"));

  const patched = replaceField(SAMPLE, spans[0]!, "summary", "New summary.");
  ok("field replacement works", Boolean(patched?.includes('summary: "New summary."')));
  ok(
    "replacement leaves the other entry alone",
    Boolean(patched?.includes('summary: "Beta summary."')),
  );
  ok(
    "replacement does not touch other fields",
    Boolean(patched?.includes('deadline: "2027-01-01"')),
  );

  const added = replaceField(SAMPLE, spans[1]!, "sourceUrl", "https://x.test");
  ok("a missing field is inserted", Boolean(added?.includes('sourceUrl: "https://x.test"')));

  const multi = replaceField(SAMPLE, spans[0]!, "grades", [9, 10]);
  eq("array-valued fields are refused rather than mangled", multi, null);

  const appended = appendEntries(SAMPLE, [
    renderEntry({ id: "gamma", title: 'Gamma "quoted"', org: "G" }),
  ]);
  ok(
    "new entries append before the bracket",
    appended.includes('id: "gamma"') && appended.trimEnd().endsWith("];"),
  );
  ok("quotes in values are escaped", appended.includes('Gamma \\"quoted\\"'));
  eq(
    "appending keeps the file parseable by the scanner",
    scanEntries(appended).map((s) => s.id),
    ["alpha", "beta", "gamma"],
  );

  eq(
    "minted ids avoid collisions",
    mintId("Alpha Program", "Alpha Org", new Set(["alpha-program-alpha-org"])),
    "alpha-program-alpha-org-2",
  );
}

/* ----------------------------------------------------- 6. change detection */

ok("identical text hashes identically", hashText("a b c") === hashText("a b c"));
ok("changed text hashes differently", hashText("a b c") !== hashText("a b d"));

/* ------------------------------------------------------------ 7. schema */

{
  const props = EXTRACT_TOOL.input_schema.properties as Record<string, unknown>;
  const required = EXTRACT_TOOL.input_schema.required;
  for (const f of [
    "title",
    "organization",
    "category",
    "grade_levels",
    "app_open_date",
    "app_deadline",
    "program_start_date",
    "program_end_date",
    "cost_type",
    "location_type",
    "essay_prompts",
    "required_documents",
    "application_link",
  ]) {
    ok(`schema declares ${f}`, f in props && required.includes(f));
  }
  ok("the schema forbids extra fields", EXTRACT_TOOL.input_schema.additionalProperties === false);
}

/* --------------------------------------------------------- 8. live (opt-in) */

if (process.argv.includes("--live") && process.env["ANTHROPIC_API_KEY"]) {
  const { extract } = await import("./extract.mts");
  const snapshot = {
    url: page.url,
    finalUrl: page.url,
    domain: "example-polytechnic.test",
    status: 200,
    text: pageText,
    contentHash: hashText(pageText),
    title: "Summer Engineering Academy | Example Polytechnic",
    jsonLd: [],
    timeElements: [{ datetime: "2027-01-12", label: "Applications open January 12, 2027" }],
    links: [],
    rendered: false,
    fetchedAt: new Date().toISOString(),
  };
  const res = await extract(snapshot, "2026-09-20");
  ok("live: extraction succeeded", res.program != null, res.errors.join("; "));
  if (res.program) {
    eq("live: deadline read correctly", res.program.app_deadline?.value, "2027-03-01");
    eq("live: start date read correctly", res.program.program_start_date?.value, "2027-07-05");
    eq("live: end date read correctly", res.program.program_end_date?.value, "2027-07-30");
    eq("live: grades not over-filled", res.program.grade_levels, [11, 12]);
    eq("live: bursaries recognised", res.program.cost_type, "Need-Based Aid");
    ok("live: essay prompts captured", res.program.essay_prompts.length >= 1);
  }
} else {
  console.log("(skipping live extraction — pass --live with ANTHROPIC_API_KEY to run it)\n");
}

/* ------------------------------------------------------------------ done */

console.log(`${passed} assertions passed`);
if (failures.length) {
  console.error(`\n${failures.length} FAILED:`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log("data engine checks OK");
