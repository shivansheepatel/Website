/**
 * ============================================================================
 *  MATCHING ENGINE
 * ============================================================================
 *
 * Turns a student's four quiz answers into a ranked, *explained* list of
 * programs. Every recommendation carries the reasons it was chosen, which is
 * the difference between a roadmap a student trusts and a black box they
 * ignore. If we cannot say why something matched, it should not be shown.
 *
 * The engine is pure: same profile + same catalogue + same `now` = same result.
 * That makes it trivial to unit-test and safe to run during SSR.
 */

import { matchesBudget, matchesCommitment, type NormalizedProgram } from "@/lib/program-schema";
import {
  categoriesForInterests,
  INTERESTS_BY_ID,
  programMatchesTrack,
  SKILLS_BY_ID,
  type BudgetPreference,
  type CommitmentPreference,
} from "@/data/taxonomy";

/* -------------------------------------------------------------------------- */
/*  Profile                                                                    */
/* -------------------------------------------------------------------------- */

export interface StudentProfile {
  /** Current grade, or null if the student skipped that step. */
  grade: number | null;
  /** Target graduation year, e.g. 2028. */
  gradYear: number | null;
  /** Interest ids from `taxonomy.INTERESTS`. */
  interests: string[];
  /** Skill ids from `taxonomy.SKILLS`. */
  skills: string[];
  commitment: CommitmentPreference;
  budget: BudgetPreference;
  /** ISO timestamp of when the quiz was finished. Null while incomplete. */
  completedAt: string | null;
}

export const EMPTY_PROFILE: StudentProfile = {
  grade: null,
  gradYear: null,
  interests: [],
  skills: [],
  commitment: "any",
  budget: "any",
  completedAt: null,
};

/** A profile is "useful" once it can meaningfully change what we show. */
export function hasSignal(profile: StudentProfile): boolean {
  return (
    profile.grade !== null ||
    profile.interests.length > 0 ||
    profile.skills.length > 0 ||
    profile.budget !== "any" ||
    profile.commitment !== "any"
  );
}

/* -------------------------------------------------------------------------- */
/*  Scoring                                                                    */
/* -------------------------------------------------------------------------- */

export interface ScoredProgram {
  program: NormalizedProgram;
  score: number;
  /** Plain-language reasons, shown to the student on the card. */
  reasons: string[];
}

const WEIGHTS = {
  interest: 40,
  grade: 22,
  skillEach: 12,
  skillCap: 30,
  budget: 14,
  commitment: 10,
  actionable: 10,
  openingSoon: 8,
  urgent: 6,
  verified: 5,
} as const;

/**
 * Score one program. Returns `null` when the program should never be shown to
 * this student — a hard exclusion, not a low score.
 *
 * Hard exclusions are deliberately few:
 *   1. The program is closed, or already running (nothing to apply to).
 *   2. The student said "free only" and the program charges.
 *   3. The student gave a grade the program does not admit.
 * Everything else is a soft preference that nudges the ranking.
 */
export function scoreProgram(
  program: NormalizedProgram,
  profile: StudentProfile,
): ScoredProgram | null {
  if (program.phase === "closed") return null;
  // A cohort already running cannot be applied to. It resurfaces on the program
  // page as "alert me for the next cohort" rather than as a recommendation.
  if (program.phase === "in-session") return null;

  if (profile.budget === "free" && !matchesBudget(program, "free")) return null;
  if (profile.grade !== null && !program.grades.includes(profile.grade)) return null;

  const reasons: string[] = [];
  let score = 0;

  // Track matching is deliberately narrower than category matching: a student
  // who picked "Robotics" should not be handed every STEM listing. A category
  // hit without a keyword hit still counts, at half weight, because the track
  // is the right neighbourhood even when the wording does not line up.
  const tracks = profile.interests
    .map((id) => INTERESTS_BY_ID.get(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  const exactTrack = tracks.find((t) => programMatchesTrack(t, program.category, program.haystack));
  if (exactTrack) {
    score += WEIGHTS.interest;
    reasons.push(`Matches your ${exactTrack.label} track`);
  } else if (categoriesForInterests(profile.interests).includes(program.category)) {
    score += Math.round(WEIGHTS.interest / 2);
    reasons.push(`In ${program.category}, one of your areas`);
  }

  if (profile.grade !== null) {
    score += WEIGHTS.grade;
    reasons.push(`Open to Grade ${profile.grade}`);
  }

  const sharedSkills = profile.skills.filter((s) => program.skills.includes(s));
  if (sharedSkills.length > 0) {
    score += Math.min(sharedSkills.length * WEIGHTS.skillEach, WEIGHTS.skillCap);
    const names = sharedSkills
      .map((id) => SKILLS_BY_ID.get(id)?.label)
      .filter((n): n is string => Boolean(n));
    if (names.length > 0) reasons.push(`Builds ${names.join(" and ")}`);
  }

  if (profile.budget !== "any" && matchesBudget(program, profile.budget)) {
    score += WEIGHTS.budget;
    if (program.costTier === "earns") reasons.push("This one pays you");
    else if (program.costTier === "free") reasons.push("Free to take part");
    else if (program.costTier === "aid") reasons.push("Need-based aid available");
  }

  if (profile.commitment !== "any" && program.commitment === profile.commitment) {
    score += WEIGHTS.commitment;
    reasons.push("Fits the time you said you have");
  }

  // Actionable now — a student can start an application today.
  if (program.phase === "open") {
    score += WEIGHTS.actionable;
    if (program.urgency === "closing-soon") {
      score += WEIGHTS.urgent;
      reasons.push(program.label);
    }
  }
  // Not open yet, but knowing the date early is its own kind of useful: it is
  // the only phase where a student still has time to prepare properly.
  if (program.phase === "opening-soon") {
    score += WEIGHTS.openingSoon;
    reasons.push(program.label);
  }

  if (program.verificationStatus === "verified") {
    score += WEIGHTS.verified;
  }

  return { program, score, reasons };
}

/**
 * Rank the catalogue for a student.
 *
 * With no profile signal we fall back to pure urgency, which is still a
 * genuinely useful ordering — a student who skipped the quiz sees the things
 * closing soonest rather than an arbitrary list.
 */
export function rankPrograms(
  programs: NormalizedProgram[],
  profile: StudentProfile,
  limit?: number,
): ScoredProgram[] {
  const scored: ScoredProgram[] = [];
  for (const p of programs) {
    const result = scoreProgram(p, profile);
    if (result) scored.push(result);
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const da = a.program.daysRemaining ?? Number.MAX_SAFE_INTEGER;
    const db = b.program.daysRemaining ?? Number.MAX_SAFE_INTEGER;
    if (da !== db) return da - db;
    return a.program.title.localeCompare(b.program.title);
  });

  return typeof limit === "number" ? scored.slice(0, limit) : scored;
}

/**
 * The skills a student should focus on, ordered by how much of their matched
 * catalogue actually rewards each one. Their own chosen skills are boosted so
 * the advice stays anchored to what they said they wanted.
 */
export function recommendedSkills(
  scored: ScoredProgram[],
  profile: StudentProfile,
  limit = 4,
): { id: string; label: string; count: number; chosen: boolean }[] {
  const counts = new Map<string, number>();
  for (const { program } of scored) {
    for (const id of program.skills) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([id, count]) => {
      const chosen = profile.skills.includes(id);
      return {
        id,
        label: SKILLS_BY_ID.get(id)?.label ?? id,
        count,
        chosen,
        weight: count + (chosen ? 1000 : 0),
      };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map(({ id, label, count, chosen }) => ({ id, label, count, chosen }));
}

/** Matching filters applied without ranking — used by the Explore page. */
export function applyProfileAsFilter(
  programs: NormalizedProgram[],
  profile: StudentProfile,
): NormalizedProgram[] {
  const categories = categoriesForInterests(profile.interests);
  return programs.filter((p) => {
    if (categories.length > 0 && !categories.includes(p.category)) return false;
    if (profile.grade !== null && !p.grades.includes(profile.grade)) return false;
    if (!matchesBudget(p, profile.budget)) return false;
    if (!matchesCommitment(p, profile.commitment)) return false;
    return true;
  });
}
