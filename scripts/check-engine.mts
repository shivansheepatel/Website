/**
 * ============================================================================
 *  ENGINE CHECKS
 * ============================================================================
 *
 * Assertions over the pure logic that decides what a student is shown:
 * the classifiers in `program-schema.ts`, the scoring in `match.ts`, and the
 * timeline in `roadmap.ts`.
 *
 * It runs on plain Node with type stripping and a 20-line resolve hook — no
 * test framework, no transpile step, nothing to keep up to date. That is
 * deliberate: a check that costs nothing to run is a check that keeps running.
 *
 * Two kinds of assertion here, and the second kind matters more:
 *
 *   - EXACT     — "Free — these are paid positions" must classify as `earns`.
 *   - PROPORTION — the classifiers must not quietly give up. If a future edit
 *     breaks the cost parser, every listing lands in `unknown`, every exact
 *     test still passes, and the site silently stops filtering by cost. The
 *     distribution assertions catch that.
 *
 *   npm run check:engine
 */

import {
  classifyCommitment,
  classifyCost,
  classifyDelivery,
  getProgramStatus,
  getTimeRemaining,
  normalize,
  normalizeAll,
  type NormalizedProgram,
} from "@/lib/program-schema";
import type { Program } from "@/data/programs";
import { EMPTY_PROFILE, rankPrograms, type StudentProfile } from "@/lib/match";
import { buildRoadmap, graduationYearFor } from "@/lib/roadmap";

/** A fixed clock, so the checks do not start failing as real deadlines pass. */
const NOW = new Date("2026-09-19T12:00:00Z");

let failures = 0;
function check(label: string, condition: boolean, detail = "") {
  if (!condition) failures += 1;
  console.log(`${condition ? "  ok  " : " FAIL "} ${label}${detail ? `  — ${detail}` : ""}`);
}
function section(name: string) {
  console.log(`\n${name}`);
}

const all = normalizeAll(NOW);
const tally = (get: (p: NormalizedProgram) => string) =>
  all.reduce<Record<string, number>>((acc, p) => {
    const key = get(p);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

const costs = tally((p) => p.costTier);
const commitments = tally((p) => p.commitment);
const deliveries = tally((p) => p.delivery);

console.log(
  `Catalogue: ${all.length} listings, normalized against ${NOW.toISOString().slice(0, 10)}`,
);
console.log("  cost tier   :", costs);
console.log("  commitment  :", commitments);
console.log("  delivery    :", deliveries);
console.log(
  "  phase       :",
  tally((p) => p.phase),
);
console.log(
  "  urgency     :",
  tally((p) => p.urgency),
);
console.log(
  "  verification:",
  tally((p) => p.verificationStatus),
);

section("Classifiers — exact cases");
check(
  "cost: paid position beats the word 'free'",
  classifyCost("Free — these are paid positions") === "earns",
);
check("cost: plain free", classifyCost("Free") === "free");
check(
  "cost: a fee with aid is 'aid', not 'paid'",
  classifyCost("$6,500 — need-based financial aid available") === "aid",
);
check("cost: a bare fee is 'paid'", classifyCost("Program fee applies") === "paid");
check(
  "cost: unpublished figures are 'unknown'",
  classifyCost("Not listed — check the official page") === "unknown",
);
check(
  "commitment: a month-long residency is intensive",
  classifyCommitment("Month-long STEAM residency") === "intensive",
);
check(
  "commitment: a two-week course is medium",
  classifyCommitment("Two-week summer course") === "medium",
);
check(
  "commitment: a contest is light",
  classifyCommitment("A national coding competition") === "light",
);
check(
  "delivery: a video submission is online",
  classifyDelivery("Video speech submission", "Online submission") === "online",
);
check(
  "delivery: residential is in person",
  classifyDelivery("In person, residential", "Toronto") === "in-person",
);
check(
  "delivery: both modes is hybrid",
  classifyDelivery("In person and online options", "Toronto") === "hybrid",
);

section("Classifiers — distribution (catches a parser that has silently given up)");
check(
  "cost: at least four tiers are in use",
  Object.keys(costs).length >= 4,
  `${Object.keys(costs).length} tiers`,
);
check(
  "cost: 'unknown' stays under 15%",
  (costs["unknown"] ?? 0) < all.length * 0.15,
  `${costs["unknown"] ?? 0}/${all.length}`,
);
check(
  "commitment: 'unknown' stays under 35%",
  (commitments["unknown"] ?? 0) < all.length * 0.35,
  `${commitments["unknown"] ?? 0}/${all.length}`,
);
check(
  "delivery: 'unknown' stays under 35%",
  (deliveries["unknown"] ?? 0) < all.length * 0.35,
  `${deliveries["unknown"] ?? 0}/${all.length}`,
);

section("Skill tagging is evidence-based");
const tagged = all.filter((p) => p.skills.length > 0).length;
const overTagged = all.filter((p) => p.skills.length >= 6).length;
check(
  "most listings earn at least one skill tag",
  tagged > all.length * 0.6,
  `${tagged}/${all.length}`,
);
check(
  "almost nothing is tagged with everything",
  overTagged < all.length * 0.1,
  `${overTagged} with 6+`,
);

section("Deadline state");
check(
  "nothing past its deadline is shown as open",
  !all.some((p) => p.status !== "closed" && (p.daysRemaining ?? 0) < 0),
);
check(
  "every listing has an urgency label",
  all.every((p) => p.urgencyLabel.length > 0),
);
check(
  "undated listings have no countdown",
  all.filter((p) => p.status === "rolling").every((p) => p.daysRemaining === null),
);

section("Graduation year");
check(
  "Grade 10 in September 2026 graduates 2029",
  graduationYearFor(10, new Date("2026-09-19")) === 2029,
);
check(
  "the same student in March 2027 still graduates 2029",
  graduationYearFor(10, new Date("2027-03-19")) === 2029,
);
check(
  "Grade 12 in September 2026 graduates 2027",
  graduationYearFor(12, new Date("2026-09-19")) === 2027,
);

/* -------------------------------------------------------------------------- */
/*  Lifecycle engine                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The catalogue carries no lifecycle dates yet (organisers rarely publish
 * them), so the four phases are exercised against synthetic listings. That is
 * the point of testing the engine rather than the data: the states have to be
 * correct on the day someone fills the dates in, not only once they have.
 */
const iso = (offsetDays: number) =>
  new Date(NOW.getTime() + offsetDays * 86_400_000).toISOString().slice(0, 10);

const base: Program = {
  id: "fixture",
  title: "Fixture Program",
  org: "Test Org",
  category: "STEM",
  grades: [11],
  summary: "s",
  description: "d",
  eligibility: "e",
  deadline: null,
  confidence: "confirmed",
  cost: "Free",
  format: "In person",
  location: "Toronto",
  url: "https://example.org",
  lastChecked: iso(-1),
};

section("Lifecycle — the four states");
check(
  "a future open date means 'opening soon'",
  getProgramStatus({ ...base, appOpenDate: iso(30), deadline: iso(90) }, NOW).phase ===
    "opening-soon",
);
check(
  "past open date + future deadline means 'open'",
  getProgramStatus({ ...base, appOpenDate: iso(-10), deadline: iso(40) }, NOW).phase === "open",
);
check(
  "inside the run window means 'in session', even though the deadline has passed",
  getProgramStatus(
    { ...base, deadline: iso(-30), programStartDate: iso(-5), programEndDate: iso(20) },
    NOW,
  ).phase === "in-session",
);
check(
  "a past deadline with no run window means 'closed'",
  getProgramStatus({ ...base, deadline: iso(-5) }, NOW).phase === "closed",
);
check(
  "no dates at all means 'rolling', not 'closed'",
  getProgramStatus(base, NOW).phase === "rolling",
);
check(
  "a finished run falls back to closed",
  getProgramStatus(
    { ...base, deadline: iso(-200), programStartDate: iso(-100), programEndDate: iso(-60) },
    NOW,
  ).phase === "closed",
);
check(
  "a future open date wins over a passed deadline — that is next cycle",
  getProgramStatus({ ...base, deadline: iso(-20), appOpenDate: iso(40) }, NOW).phase ===
    "opening-soon",
);

section("Lifecycle — urgency is separate from phase");
check(
  "inside 21 days is 'closing-soon'",
  getProgramStatus({ ...base, deadline: iso(10) }, NOW).urgency === "closing-soon",
);
check(
  "22–60 days is 'approaching'",
  getProgramStatus({ ...base, deadline: iso(45) }, NOW).urgency === "approaching",
);
check(
  "beyond 60 days has no urgency",
  getProgramStatus({ ...base, deadline: iso(120) }, NOW).urgency === "none",
);
check(
  "a closed program carries no urgency",
  getProgramStatus({ ...base, deadline: iso(-3) }, NOW).urgency === "none",
);

section("Lifecycle — honest degradation");
const noDates = getProgramStatus({ ...base, deadline: iso(30) }, NOW);
check("a missing open date is reported as unknown, not assumed", noDates.known.open === false);
check("a published deadline is reported as known", noDates.known.deadline === true);
check("a missing run window is reported as unknown", noDates.known.runs === false);
check(
  "normalize() lists exactly the missing date fields",
  normalize({ ...base, deadline: iso(30) }, NOW).missingDates.join(",") === "open,runs",
);

section("Countdown arithmetic");
const soon = getTimeRemaining(iso(3), NOW);
check("three days out reports three days", soon.days === 3, `${soon.days}`);
check("a live countdown is not expired", soon.expired === false);
check(
  "the clock string carries d/hh:mm:ss",
  /^\d+d \d{2}:\d{2}:\d{2}$/.test(soon.clock),
  soon.clock,
);
const gone = getTimeRemaining(iso(-4), NOW);
check("a passed date is expired", gone.expired === true);
check("a passed date says how long ago", gone.label.includes("Closed"), gone.label);
check("a null target is handled", getTimeRemaining(null, NOW).expired === true);

section("Matching — hard exclusions are absolute");
const student: StudentProfile = {
  ...EMPTY_PROFILE,
  grade: 11,
  gradYear: 2028,
  budget: "free",
  interests: ["stem"],
  skills: ["coding"],
};
const ranked = rankPrograms(all, student);
check("no closed program is ever recommended", !ranked.some((r) => r.program.phase === "closed"));
check(
  "a cohort already running is never recommended",
  !ranked.some((r) => r.program.phase === "in-session"),
);
check(
  "'free only' is honoured, not merely down-ranked",
  ranked.every((r) => ["free", "earns"].includes(r.program.costTier)),
);
check(
  "a stated grade is honoured",
  ranked.every((r) => r.program.grades.includes(11)),
);
check(
  "every match explains itself",
  ranked.every((r) => r.reasons.length > 0),
);
check(
  "scores are monotonically descending",
  ranked.every((r, i) => i === 0 || (ranked[i - 1]?.score ?? 0) >= r.score),
);
check(
  "a normal profile still gets a useful number of matches",
  ranked.length > 15,
  `${ranked.length} matches`,
);

section("Matching — degrades gracefully");
const openCount = all.filter((p) => p.phase !== "closed" && p.phase !== "in-session").length;
check(
  "no answers at all falls back to the open catalogue",
  rankPrograms(all, EMPTY_PROFILE).length === openCount,
  `${openCount}`,
);
const narrow: StudentProfile = {
  ...EMPTY_PROFILE,
  grade: 9,
  budget: "free",
  interests: ["health"],
  commitment: "intensive",
};
check(
  "a very narrow profile still returns something",
  rankPrograms(all, narrow).length > 0,
  `${rankPrograms(all, narrow).length} matches`,
);

section("Roadmap");
const { quarters, rolling } = buildRoadmap(ranked, student, { now: NOW });
check("the first term is the one the student is in", quarters[0]?.isCurrent === true);
check(
  "terms run in order",
  quarters.every((q, i) => i === 0 || (quarters[i - 1]?.start as Date) < q.start),
);
check(
  "every deadline sits inside the term it is filed under",
  quarters.every((q) =>
    q.milestones.every((s) => {
      const d = new Date(`${s.date}T12:00:00`);
      return d >= q.start && d <= q.end;
    }),
  ),
);
check(
  "nothing undated is placed on the timeline",
  quarters.every((q) => q.milestones.every((m) => Boolean(m.date))),
);
check(
  "undated matches are surfaced separately instead",
  rolling.every((s) => s.program.deadline === null),
);
check(
  "every term carries written guidance",
  quarters.every((q) => q.focus.length > 20),
);
check(
  "trailing empty terms are trimmed",
  (quarters.at(-1)?.milestones.length ?? 0) > 0 || quarters.length === 3,
);
const graduating: StudentProfile = { ...student, grade: 12, gradYear: 2027 };
check(
  "the timeline stops at graduation",
  buildRoadmap(rankPrograms(all, graduating), graduating, { now: NOW }).quarters.length < 6,
);

console.log("\nTerms produced:");
for (const q of quarters) {
  const skills = q.skillTags.map((s) => s.label).join(", ") || "—";
  console.log(
    `  ${q.label.padEnd(18)} ${String(q.milestones.length).padStart(2)} milestone(s)  focus: ${skills}`,
  );
}

console.log(`\n${failures === 0 ? "All engine checks passed." : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
