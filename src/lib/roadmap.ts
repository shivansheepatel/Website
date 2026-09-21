/**
 * ============================================================================
 *  ROADMAP ENGINE
 * ============================================================================
 *
 * Turns ranked matches into a timeline a student can plan around: term by
 * term, from today to graduation.
 *
 * MILESTONES, NOT PROGRAMS. One program can put two or three marks on the
 * calendar — the day applications open, the day they close, the day it starts
 * — and a student needs all of them in the right months. Bucketing whole
 * programs would collapse that into one date and lose the run-up, which is
 * exactly the part they need warning about.
 *
 * School terms rather than calendar quarters, because a sixteen-year-old
 * thinks in "this fall" and "next summer" — and because the application cycle
 * genuinely runs on that rhythm.
 */

import { recommendedSkills, type ScoredProgram, type StudentProfile } from "@/lib/match";
import type { NormalizedProgram } from "@/lib/program-schema";

export type Season = "Fall" | "Winter" | "Spring" | "Summer";

/** One dated thing a student has to do or know about. */
export interface Milestone {
  id: string;
  kind: "opens" | "deadline" | "starts";
  date: string;
  program: NormalizedProgram;
  score: number;
  reasons: string[];
}

export interface RoadmapQuarter {
  key: string;
  season: Season;
  /** "Fall 2026", or "Winter 2026–27" for the term that spans New Year. */
  label: string;
  months: string;
  start: Date;
  end: Date;
  isCurrent: boolean;
  milestones: Milestone[];
  /** What to work on this term, in plain language. */
  focus: string;
  skillTags: { id: string; label: string; count: number; chosen: boolean }[];
}

const MILESTONE_LABEL: Record<Milestone["kind"], string> = {
  opens: "Applications open",
  deadline: "Deadline",
  starts: "Program starts",
};

export const milestoneLabel = (kind: Milestone["kind"]) => MILESTONE_LABEL[kind];

/* -------------------------------------------------------------------------- */
/*  Graduation                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Graduating year from a current grade.
 *
 * School years end in June, so a Grade 10 student in October 2026 and the same
 * student in March 2027 both graduate in 2029. Lives here rather than in the
 * quiz component because it is pure date arithmetic the roadmap depends on —
 * and because logic buried in a component cannot be tested.
 */
export function graduationYearFor(grade: number, now: Date = new Date()): number {
  const inFallTerm = now.getMonth() >= 7; // August onward = a new school year
  const schoolYearEnd = inFallTerm ? now.getFullYear() + 1 : now.getFullYear();
  return schoolYearEnd + (12 - grade);
}

/* -------------------------------------------------------------------------- */
/*  Term arithmetic                                                            */
/* -------------------------------------------------------------------------- */

const SEASON_BY_START_MONTH: Record<number, Season> = {
  8: "Fall",
  11: "Winter",
  2: "Spring",
  5: "Summer",
};

const MONTH_RANGE: Record<Season, string> = {
  Fall: "Sep – Nov",
  Winter: "Dec – Feb",
  Spring: "Mar – May",
  Summer: "Jun – Aug",
};

function termStart(date: Date): Date {
  const y = date.getFullYear();
  const m = date.getMonth();
  if (m >= 8 && m <= 10) return new Date(y, 8, 1);
  if (m === 11) return new Date(y, 11, 1);
  if (m <= 1) return new Date(y - 1, 11, 1);
  if (m >= 2 && m <= 4) return new Date(y, 2, 1);
  return new Date(y, 5, 1);
}

const addMonths = (date: Date, count: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + count, 1);

function labelFor(season: Season, start: Date): string {
  if (season === "Winter") {
    const next = (start.getFullYear() + 1) % 100;
    return `Winter ${start.getFullYear()}–${String(next).padStart(2, "0")}`;
  }
  return `${season} ${start.getFullYear()}`;
}

/* -------------------------------------------------------------------------- */
/*  Editorial guidance per term                                                */
/* -------------------------------------------------------------------------- */

function focusFor(season: Season, gradingYear: boolean): string {
  if (gradingYear && season === "Fall") {
    return "Graduating-year fall: university applications and your biggest scholarship deadlines land this term. Anything you add now needs to be finished, not started.";
  }
  switch (season) {
    case "Fall":
      return "Application season. Most summer programs post now — line up references early and get one application fully done before November.";
    case "Winter":
      return "The heaviest deadline term. Most competitive summer programs close between January and March, so front-load the work over the December break.";
    case "Spring":
      return "Results and late deadlines. Confirm your summer plans, chase anything still open, and start researching next year's cycle.";
    case "Summer":
      return "Do the thing. Programs run now — keep a running note of what you actually did, because that is what you will write about in the fall.";
  }
}

/* -------------------------------------------------------------------------- */
/*  Build                                                                      */
/* -------------------------------------------------------------------------- */

export interface BuildRoadmapOptions {
  maxQuarters?: number;
  now?: Date;
}

/** Never show fewer than this many terms, even if they are all empty. */
const MIN_QUARTERS = 3;

/** Every dated thing a scored program contributes to the calendar. */
export function milestonesFor(scored: ScoredProgram): Milestone[] {
  const { program, score, reasons } = scored;
  const out: Milestone[] = [];
  if (program.appOpenDate) {
    out.push({
      id: `${program.id}:opens`,
      kind: "opens",
      date: program.appOpenDate,
      program,
      score,
      reasons,
    });
  }
  if (program.deadline) {
    out.push({
      id: `${program.id}:deadline`,
      kind: "deadline",
      date: program.deadline,
      program,
      score,
      reasons,
    });
  }
  if (program.programStartDate) {
    out.push({
      id: `${program.id}:starts`,
      kind: "starts",
      date: program.programStartDate,
      program,
      score,
      reasons,
    });
  }
  return out;
}

/**
 * Lay ranked matches onto a term timeline.
 *
 * Programs with no dates at all are deliberately excluded from the terms —
 * putting a guess on a calendar is how students miss real deadlines. They come
 * back separately as `rolling` so the UI can list them as "apply any time".
 */
export function buildRoadmap(
  scored: ScoredProgram[],
  profile: StudentProfile,
  options: BuildRoadmapOptions = {},
): { quarters: RoadmapQuarter[]; rolling: ScoredProgram[] } {
  const now = options.now ?? new Date();
  const maxQuarters = options.maxQuarters ?? 6;

  const all = scored.flatMap(milestonesFor);
  const rolling = scored.filter((s) => milestonesFor(s).length === 0).slice(0, 8);

  const graduation = profile.gradYear !== null ? new Date(profile.gradYear, 5, 30) : null;

  const quarters: RoadmapQuarter[] = [];
  let cursor = termStart(now);

  for (let i = 0; i < maxQuarters; i += 1) {
    const start = cursor;
    const end = new Date(addMonths(start, 3).getTime() - 1);
    const season = SEASON_BY_START_MONTH[start.getMonth()] ?? "Fall";

    if (graduation && start > graduation) break;

    const milestones = all
      .filter((m) => {
        const d = new Date(`${m.date}T12:00:00`);
        return d >= start && d <= end;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || b.score - a.score)
      .slice(0, 10);

    const gradingYear =
      profile.gradYear !== null &&
      season === "Fall" &&
      start.getFullYear() === profile.gradYear - 1;

    // Skill tags are drawn from the programs appearing this term, deduplicated
    // so a program with two milestones does not double-count its skills.
    const uniquePrograms = [...new Map(milestones.map((m) => [m.program.id, m])).values()].map(
      (m) => ({ program: m.program, score: m.score, reasons: m.reasons }),
    );

    quarters.push({
      key: `${start.getFullYear()}-${season.toLowerCase()}`,
      season,
      label: labelFor(season, start),
      months: MONTH_RANGE[season],
      start,
      end,
      isCurrent: i === 0,
      milestones,
      focus: focusFor(season, gradingYear),
      skillTags: recommendedSkills(uniquePrograms, profile, 3),
    });

    cursor = addMonths(start, 3);
  }

  /**
   * Trim trailing empty terms. The catalogue rarely reaches more than a year
   * ahead, so a Grade 9 student would otherwise stare at three blank terms —
   * which reads as "there is nothing for you" rather than "we do not know
   * yet". One quiet term in the middle is useful; a run of them at the end is
   * just noise.
   */
  while (quarters.length > MIN_QUARTERS && (quarters.at(-1)?.milestones.length ?? 0) === 0) {
    quarters.pop();
  }

  return { quarters, rolling };
}

/** Every distinct program on a roadmap, for calendar export. */
export function roadmapPrograms(quarters: RoadmapQuarter[]): NormalizedProgram[] {
  const seen = new Map<string, NormalizedProgram>();
  for (const q of quarters) {
    for (const m of q.milestones) seen.set(m.program.id, m.program);
  }
  return [...seen.values()];
}
