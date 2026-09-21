/**
 * ============================================================================
 *  BYTE'S SCRIPT
 * ============================================================================
 *
 * Every line the mascot says, in one file, so the character's voice can be
 * rewritten (or translated, or made less chirpy) without touching a component.
 *
 * Two rules the writing follows:
 *
 *  1. REACT TO WHAT THEY ACTUALLY SAID. A response that would fit any answer
 *     is worse than no response — it tells a student the character is not
 *     listening. Each reaction below keys off a specific choice.
 *
 *  2. NEVER OVERSELL. Byte is encouraging, not a hype machine. It does not
 *     tell a student that everything is amazing, and it says plainly when a
 *     combination of answers is narrow.
 */

import { MASCOT } from "@/config/site";
import { INTERESTS_BY_ID, SKILLS_BY_ID } from "@/data/taxonomy";
import type { StudentProfile } from "@/lib/match";
import type { ByteMood } from "@/components/mascot/Byte";

export interface Line {
  text: string;
  mood: ByteMood;
}

const NAME = MASCOT.name;

/** Opening line for each quiz step. */
export const STEP_PROMPTS: Record<string, Line> = {
  grade: {
    text: `Hey — I'm ${NAME}. Four quick questions and I'll build you a plan. What grade are you in right now?`,
    mood: "encouraging",
  },
  interests: {
    text: "Nice. So what actually pulls you in? Pick as many as you like — or none, I'll cope.",
    mood: "curious",
  },
  skills: {
    text: "And what do you want to get *better* at this year? I only tag a program with a skill if its own description backs it up.",
    mood: "thoughtful",
  },
  fit: {
    text: "Last one. Be honest about time and money — a plan you can't actually do isn't a plan.",
    mood: "thoughtful",
  },
  result: {
    text: "Done. Here's what I found for you.",
    mood: "proud",
  },
};

/* -------------------------------------------------------------------------- */
/*  Reactions                                                                  */
/* -------------------------------------------------------------------------- */

export function reactToGrade(grade: number | null, gradYear: number | null): Line | null {
  if (grade === null) return null;
  if (grade === 9)
    return {
      text: `Grade 9 — you've got the most runway of anyone. Class of ${gradYear}. We can be picky.`,
      mood: "excited",
    };
  if (grade === 10)
    return {
      text: `Grade 10, class of ${gradYear}. Sweet spot: old enough for most programs, early enough to build something.`,
      mood: "excited",
    };
  if (grade === 11)
    return {
      text: `Grade 11 — the year that does the heavy lifting. Class of ${gradYear}. Let's not waste it.`,
      mood: "encouraging",
    };
  return {
    text: `Grade 12, class of ${gradYear}. Tight window, so I'll rank by what you can still finish.`,
    mood: "thoughtful",
  };
}

export function reactToInterests(ids: string[]): Line | null {
  if (ids.length === 0) return null;
  const labels = ids
    .map((id) => INTERESTS_BY_ID.get(id)?.label)
    .filter((l): l is string => Boolean(l));
  const first = labels[0] ?? "";

  if (labels.length >= 4)
    return {
      text: `Four tracks? Bold. I'll spread the recommendations rather than drowning you in ${first.toLowerCase()}.`,
      mood: "excited",
    };
  if (labels.length === 1)
    return { text: `${first}, locked in. I know exactly where to look.`, mood: "excited" };
  return {
    text: `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]} — good combination, those overlap more than people think.`,
    mood: "encouraging",
  };
}

export function reactToSkills(ids: string[]): Line | null {
  if (ids.length === 0) return null;
  const labels = ids
    .map((id) => SKILLS_BY_ID.get(id)?.label)
    .filter((l): l is string => Boolean(l));
  if (labels.length === 1)
    return {
      text: `${labels[0]} it is. I'll push programs that genuinely build it.`,
      mood: "encouraging",
    };
  return {
    text: `${labels.length} skills to work on. Pick one to be your anchor — the rest come along for the ride.`,
    mood: "thoughtful",
  };
}

export function reactToFit(profile: StudentProfile): Line | null {
  if (profile.budget === "free" && profile.commitment === "intensive")
    return {
      text: "Free *and* a full summer — that's a narrow slice, but the ones that exist are genuinely good. Paid positions count as free, by the way.",
      mood: "thoughtful",
    };
  if (profile.budget === "free")
    return {
      text: "Free only. Fine by me — a third of this list costs nothing, and some of it pays you.",
      mood: "encouraging",
    };
  if (profile.commitment === "light")
    return {
      text: "A few hours at a time. Contests and submissions, then — high reward per hour spent.",
      mood: "excited",
    };
  if (profile.budget === "aid")
    return {
      text: "Including need-based aid opens this up a lot. Most of it goes unclaimed because nobody asks.",
      mood: "encouraging",
    };
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Result                                                                     */
/* -------------------------------------------------------------------------- */

export function resultLine(matchCount: number, closingSoon: number): Line {
  if (matchCount === 0)
    return {
      text: "Nothing matched that exact combination. Loosen the cost or the grade and I'll try again — or just go browse, the whole list is open.",
      mood: "thoughtful",
    };
  if (closingSoon > 0)
    return {
      text: `${matchCount} matches, and ${closingSoon} of them close within three weeks. Start there.`,
      mood: "excited",
    };
  if (matchCount < 8)
    return {
      text: `${matchCount} solid matches. Small list, but every one of them fits what you told me.`,
      mood: "encouraging",
    };
  return {
    text: `${matchCount} matches. I've laid them out term by term so it doesn't all land at once.`,
    mood: "proud",
  };
}

/** Greeting on the dashboard, varying with how far along the student is. */
export function dashboardGreeting(saved: number, steps: number): Line {
  if (saved === 0)
    return {
      text: "Nothing saved yet. Find something you like and hit the bookmark — I'll track the rest.",
      mood: "curious",
    };
  if (steps === 0)
    return {
      text: `${saved} saved. Open one and start ticking off prep steps — that's where applications actually get finished.`,
      mood: "encouraging",
    };
  if (steps >= 10)
    return {
      text: `${steps} prep steps done across ${saved} programs. That is real work. Keep going.`,
      mood: "proud",
    };
  return {
    text: `${saved} saved, ${steps} prep steps done. Momentum is the whole game.`,
    mood: "encouraging",
  };
}
