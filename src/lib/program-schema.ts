/**
 * ============================================================================
 *  NORMALIZED PROGRAM MODEL + APPLICATION LIFECYCLE ENGINE
 * ============================================================================
 *
 * `src/data/programs.ts` is the *authored* shape: what a human types when they
 * add a listing. This module is the *runtime* shape, computed fresh on every
 * render so nothing about a date can go stale in a build artifact.
 *
 * THE CENTRAL RULE: no derived field is ever cached. `getProgramStatus()` takes
 * `now` and returns the phase from scratch. A deadline that passes at midnight
 * is closed the next time the page renders — there is no job to run, no cache
 * to bust, and no way for the site to keep advertising a dead application.
 *
 * HONEST DEGRADATION: most organisers publish a closing date and nothing else.
 * Every function here treats an absent date as *unknown*, never as false. A
 * program with no `appOpenDate` is not "opening soon" and not "already open" —
 * it is open-if-the-deadline-says-so, with the open date marked unpublished.
 */

import { LIFECYCLE } from "@/config/site";
import { PROGRAMS, daysUntil, type Category, type Confidence, type Program } from "@/data/programs";
import { SKILLS } from "@/data/taxonomy";

/* -------------------------------------------------------------------------- */
/*  Vocabularies                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Where a program sits in its application lifecycle. These five drive the card
 * and detail-page layouts — each phase gets a different arrangement because a
 * student needs different things from each.
 *
 * - `opening-soon` — applications are not open yet, but the open date is known.
 *                    Show what to prepare in the meantime.
 * - `open`         — accepting applications. Show the countdown and the
 *                    materials checklist.
 * - `in-session`   — the program is running right now. Applications are done;
 *                    show the run dates and offer a next-cohort reminder.
 * - `closed`       — this cycle has ended and the program is not running.
 * - `rolling`      — no dates published at all: rolling intake, open until
 *                    full, or dates each school sets locally.
 */
export type LifecyclePhase = "opening-soon" | "open" | "in-session" | "closed" | "rolling";

/** Urgency *within* the open phase. Never a phase of its own. */
export type Urgency = "none" | "approaching" | "closing-soon";

/** Kept for compatibility with the pre-lifecycle UI. */
export type ProgramStatus = LifecyclePhase | "upcoming" | "closing-soon";

export type VerificationStatus = "verified" | "estimated" | "unposted" | "needs-recheck";

export type CostTier = "earns" | "free" | "aid" | "paid" | "unknown";
export type Delivery = "in-person" | "online" | "hybrid" | "unknown";
export type Commitment = "light" | "medium" | "intensive" | "unknown";

/* -------------------------------------------------------------------------- */
/*  Time remaining                                                             */
/* -------------------------------------------------------------------------- */

export interface TimeRemaining {
  /** Total milliseconds left. Negative once the target has passed. */
  ms: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  /** Coarse label, safe to render during SSR: "3 days left". */
  label: string;
  /** Clock label for the live countdown: "3d 04:12:59". */
  clock: string;
}

const EMPTY_TIME: TimeRemaining = {
  ms: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  expired: true,
  label: "—",
  clock: "—",
};

/**
 * Time from `now` until an ISO date, broken into units.
 *
 * The target is taken as end-of-day in UTC: a deadline dated the 25th is live
 * for the whole of the 25th. Using UTC rather than the viewer's zone keeps the
 * server render and the client hydration byte-identical — see `daysUntil()` in
 * `data/programs.ts` for the full reasoning.
 */
export function getTimeRemaining(target: string | null, now: Date = new Date()): TimeRemaining {
  if (!target) return EMPTY_TIME;
  const parts = target.split("-").map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  const end = Date.UTC(year, month - 1, day, 23, 59, 59, 999);
  const ms = end - now.getTime();

  if (ms <= 0) {
    const overdue = Math.ceil(-ms / 86_400_000);
    return {
      ...EMPTY_TIME,
      ms,
      expired: true,
      label: overdue <= 1 ? "Closed today" : `Closed ${overdue} days ago`,
      clock: "00:00:00",
    };
  }

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return {
    ms,
    days,
    hours,
    minutes,
    seconds,
    expired: false,
    label: days === 0 ? "Closes today" : days === 1 ? "1 day left" : `${days} days left`,
    clock:
      days > 0
        ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
  };
}

/* -------------------------------------------------------------------------- */
/*  Lifecycle status                                                           */
/* -------------------------------------------------------------------------- */

export interface LifecycleStatus {
  phase: LifecyclePhase;
  urgency: Urgency;
  /** Whole days until the application deadline. Negative = past. */
  daysRemaining: number | null;
  /** Whole days until applications open. Negative = already open. */
  daysUntilOpen: number | null;
  /** Whole days until the program itself starts. */
  daysUntilStart: number | null;
  /** Short phrase for a badge: "12 days left", "Opens in 3 weeks". */
  label: string;
  /**
   * Which dates this program actually publishes. The UI reads these to choose
   * between a real value and an honest "not published" line.
   */
  known: { open: boolean; deadline: boolean; runs: boolean };
}

const dayOf = (iso: string | null, now: Date) => daysUntil(iso, now);

function weeksPhrase(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 14) return `in ${days} days`;
  if (days < 60) return `in ${Math.round(days / 7)} weeks`;
  return `in ${Math.round(days / 30)} months`;
}

/**
 * The lifecycle engine.
 *
 * Precedence is deliberate and order-dependent:
 *   1. RUNNING NOW beats everything. If we are inside the run window the
 *      deadline has necessarily passed, and "Closed" would be a useless thing
 *      to tell a student looking at a program that is happening this week.
 *   2. A FUTURE OPEN DATE means the next cycle, even if the last deadline has
 *      passed. That is the whole point of "Opening soon": prepare now.
 *   3. Otherwise the deadline decides open vs closed.
 *   4. No deadline at all is `rolling`, which is a real state (rolling intake,
 *      open until full), not missing data.
 */
export function getProgramStatus(p: Program, now: Date = new Date()): LifecycleStatus {
  const daysRemaining = dayOf(p.deadline, now);
  const daysUntilOpen = dayOf(p.appOpenDate ?? null, now);
  const daysUntilStart = dayOf(p.programStartDate ?? null, now);
  const daysUntilEnd = dayOf(p.programEndDate ?? null, now);

  const known = {
    open: Boolean(p.appOpenDate),
    deadline: Boolean(p.deadline),
    runs: Boolean(p.programStartDate),
  };

  // 1. running right now
  const running =
    daysUntilStart !== null &&
    daysUntilStart <= 0 &&
    (daysUntilEnd === null ? daysUntilStart > -120 : daysUntilEnd >= 0);
  if (running) {
    return {
      phase: "in-session",
      urgency: "none",
      daysRemaining,
      daysUntilOpen,
      daysUntilStart,
      label: daysUntilEnd !== null ? `Running — ${daysUntilEnd} days to go` : "Running now",
      known,
    };
  }

  // 2. applications have not opened yet
  if (daysUntilOpen !== null && daysUntilOpen > 0) {
    return {
      phase: "opening-soon",
      urgency: "none",
      daysRemaining,
      daysUntilOpen,
      daysUntilStart,
      label: `Opens ${weeksPhrase(daysUntilOpen)}`,
      known,
    };
  }

  // 3. the deadline decides
  if (daysRemaining !== null) {
    if (daysRemaining < 0) {
      return {
        phase: "closed",
        urgency: "none",
        daysRemaining,
        daysUntilOpen,
        daysUntilStart,
        label: "Closed for this cycle",
        known,
      };
    }
    const urgency: Urgency =
      daysRemaining <= LIFECYCLE.closingSoonDays
        ? "closing-soon"
        : daysRemaining <= LIFECYCLE.approachingDays
          ? "approaching"
          : "none";
    return {
      phase: "open",
      urgency,
      daysRemaining,
      daysUntilOpen,
      daysUntilStart,
      label:
        daysRemaining === 0
          ? "Closes today"
          : daysRemaining === 1
            ? "1 day left"
            : `${daysRemaining} days left`,
      known,
    };
  }

  // 4. nothing published
  return {
    phase: "rolling",
    urgency: "none",
    daysRemaining: null,
    daysUntilOpen,
    daysUntilStart,
    label: "Rolling / not posted",
    known,
  };
}

/* -------------------------------------------------------------------------- */
/*  Classifiers                                                                */
/* -------------------------------------------------------------------------- */

const has = (text: string, ...needles: string[]) => needles.some((n) => text.includes(n));

/**
 * Cost is authored as a sentence a human wrote, not an enum, because the real
 * world is "Program fee with residence; bursaries available". We bucket it and
 * always show the original sentence next to the bucket so nothing is lost.
 */
export function classifyCost(cost: string): CostTier {
  const t = cost.toLowerCase();
  if (
    has(t, "paid position", "these are paid", "stipend", "wage", "hourly", "salar", "you are paid")
  )
    return "earns";
  if (has(t, "not listed", "varies")) return "unknown";
  if (
    has(
      t,
      "free",
      "no cost",
      "fully funded",
      "fully sponsored",
      "costs are funded",
      "tuition covered",
      "travel and program costs are funded",
    )
  )
    return "free";
  if (
    has(
      t,
      "bursar",
      "subsid",
      "financial aid",
      "financial assistance",
      "scholarship support",
      "grant",
      "waiver",
      "need-based",
      "sponsor",
      "often covered",
      "usually covered",
      "handled through your school",
      "set by your school",
    )
  )
    return "aid";
  return "paid";
}

export function classifyDelivery(format: string, location: string): Delivery {
  const t = `${format} ${location}`.toLowerCase();
  if (has(t, "hybrid", "and online", "online options", "in person and online")) return "hybrid";
  if (has(t, "online", "virtual", "remote", "video", "submission")) return "online";
  if (has(t, "in person", "in-person", "residential", "campus", "on site", "on-site"))
    return "in-person";
  return "unknown";
}

export function classifyCommitment(text: string): Commitment {
  const t = text.toLowerCase();
  if (
    has(
      t,
      "month-long",
      "month long",
      "residen",
      "internship",
      "full summer",
      "year-long",
      "year long",
      "co-op",
      "semester",
      "fellowship",
      "four weeks",
      "three weeks",
      "eight weeks",
      "six weeks",
    )
  )
    return "intensive";
  if (
    has(
      t,
      "two-week",
      "two week",
      "week-long",
      "week long",
      "one-week",
      "multi-week",
      "several weeks",
      "camp",
      "workshop",
      "course",
      "academy",
      "five days",
    )
  )
    return "medium";
  if (
    has(
      t,
      "competition",
      "contest",
      "submission",
      "one day",
      "single day",
      "challenge",
      "olympiad",
      "exam",
      "scholarship",
      "award",
      "conference",
      "bursary",
    )
  )
    return "light";
  return "unknown";
}

/** Skill ids a listing genuinely supports, by keyword evidence in its own text. */
export function detectSkills(haystack: string): string[] {
  return SKILLS.filter((s) => s.keywords.some((k) => haystack.includes(k))).map((s) => s.id);
}

export function verificationFor(confidence: Confidence, ageInDays: number): VerificationStatus {
  if (confidence === "unposted") return "unposted";
  if (ageInDays > LIFECYCLE.staleAfterDays) return "needs-recheck";
  return confidence === "confirmed" ? "verified" : "estimated";
}

/* -------------------------------------------------------------------------- */
/*  The normalized record                                                      */
/* -------------------------------------------------------------------------- */

export interface NormalizedProgram extends Program, LifecycleStatus {
  /** Back-compat alias for `phase`, used by older call sites. */
  status: LifecyclePhase;
  verificationStatus: VerificationStatus;
  /** ISO timestamp of the last verification pass. */
  lastVerifiedAt: string;
  ageInDays: number;
  costTier: CostTier;
  delivery: Delivery;
  commitment: Commitment;
  skills: string[];
  /** Lower-cased blob used for search and keyword matching. */
  haystack: string;
  /** Short phrase for a badge. Alias of `label`. */
  urgencyLabel: string;
  /** Where the dates came from — falls back to the application URL. */
  sourceUrl: string;
  /** Which lifecycle dates are missing. Drives the sync report and the UI. */
  missingDates: ("open" | "deadline" | "runs")[];
}

function daysSince(iso: string, now: Date): number {
  const then = new Date(`${iso}T12:00:00Z`).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((now.getTime() - then) / 86_400_000));
}

export function normalize(p: Program, now: Date = new Date()): NormalizedProgram {
  const lifecycle = getProgramStatus(p, now);
  const ageInDays = daysSince(p.lastChecked, now);
  const haystack =
    `${p.title} ${p.org} ${p.category} ${p.summary} ${p.description} ${p.eligibility} ${p.format} ${p.location}`.toLowerCase();

  const missingDates: ("open" | "deadline" | "runs")[] = [];
  if (!lifecycle.known.open) missingDates.push("open");
  if (!lifecycle.known.deadline) missingDates.push("deadline");
  if (!lifecycle.known.runs) missingDates.push("runs");

  return {
    ...p,
    ...lifecycle,
    status: lifecycle.phase,
    verificationStatus: verificationFor(p.confidence, ageInDays),
    lastVerifiedAt: `${p.lastChecked}T00:00:00Z`,
    ageInDays,
    costTier: classifyCost(p.cost),
    delivery: classifyDelivery(p.format, p.location),
    commitment: classifyCommitment(`${p.title} ${p.summary} ${p.description} ${p.format}`),
    skills: detectSkills(haystack),
    haystack,
    urgencyLabel: lifecycle.label,
    sourceUrl: p.sourceUrl ?? p.url,
    missingDates,
  };
}

/**
 * The whole catalogue, normalized against `now`.
 *
 * Call this inside a `useMemo` keyed on the clock, never at module scope — a
 * module-level constant would freeze every countdown at build time, which is
 * the exact bug this architecture exists to prevent.
 */
export function normalizeAll(now: Date = new Date()): NormalizedProgram[] {
  return PROGRAMS.map((p) => normalize(p, now));
}

/* -------------------------------------------------------------------------- */
/*  Ordering + predicates                                                      */
/* -------------------------------------------------------------------------- */

const PHASE_RANK: Record<LifecyclePhase, number> = {
  open: 0,
  "opening-soon": 1,
  "in-session": 2,
  rolling: 3,
  closed: 4,
};

/** Actionable first, then soonest deadline. */
export function byUrgency(a: NormalizedProgram, b: NormalizedProgram): number {
  const ra = PHASE_RANK[a.phase];
  const rb = PHASE_RANK[b.phase];
  if (ra !== rb) return ra - rb;
  const da = a.daysRemaining ?? a.daysUntilOpen ?? Number.MAX_SAFE_INTEGER;
  const db = b.daysRemaining ?? b.daysUntilOpen ?? Number.MAX_SAFE_INTEGER;
  if (da !== db) return da - db;
  return a.title.localeCompare(b.title);
}

/** Chronological, for the timeline view: whichever date comes next. */
export function nextDateOf(p: NormalizedProgram): string | null {
  if (p.phase === "opening-soon") return p.appOpenDate ?? p.deadline ?? null;
  if (p.phase === "in-session") return p.programEndDate ?? p.programStartDate ?? null;
  return p.deadline ?? p.appOpenDate ?? null;
}

export function matchesBudget(p: NormalizedProgram, pref: string): boolean {
  switch (pref) {
    case "free":
      return p.costTier === "free" || p.costTier === "earns";
    case "aid":
      return p.costTier === "free" || p.costTier === "earns" || p.costTier === "aid";
    default:
      return true;
  }
}

export function matchesCommitment(p: NormalizedProgram, pref: string): boolean {
  if (pref === "any" || pref === "") return true;
  return p.commitment === pref || p.commitment === "unknown";
}

/* -------------------------------------------------------------------------- */
/*  Labels                                                                     */
/* -------------------------------------------------------------------------- */

export const COST_LABELS: Record<CostTier, string> = {
  earns: "Paid position",
  free: "Free",
  aid: "Fee — aid available",
  paid: "Paid program",
  unknown: "Cost not listed",
};

export const DELIVERY_LABELS: Record<Delivery, string> = {
  "in-person": "In person",
  online: "Online",
  hybrid: "Hybrid",
  unknown: "Format varies",
};

export const COMMITMENT_LABELS: Record<Commitment, string> = {
  light: "A few hours",
  medium: "A few weeks",
  intensive: "A summer or more",
  unknown: "Varies",
};

export const PHASE_LABELS: Record<LifecyclePhase, string> = {
  "opening-soon": "Opening soon",
  open: "Applications open",
  "in-session": "In session",
  closed: "Closed",
  rolling: "Rolling intake",
};

/** One line explaining what a student should do in this phase. */
export const PHASE_GUIDANCE: Record<LifecyclePhase, string> = {
  "opening-soon": "Not open yet — use the run-up to line up references and draft your answers.",
  open: "Accepting applications now. The countdown is real; the checklist is the fastest route through it.",
  "in-session":
    "Running right now. Applications for this cohort are closed — set a reminder for the next one.",
  closed:
    "This cycle has ended. The date below is when it closed, which is a fair guide to next year.",
  rolling: "No single closing date — rolling intake, open until full, or a date your school sets.",
};

export const STATUS_LABELS = PHASE_LABELS;

export type { Category, Program };
