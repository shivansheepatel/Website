/**
 * Skill badges.
 *
 * Every badge is earned by doing something real — saving programs, ticking off
 * preparation steps, submitting applications. None of them are awarded for
 * clicking around or for time spent on the site, because a badge that costs
 * nothing teaches a student nothing.
 */

import { BADGES } from "@/config/site";

export interface BadgeProgress {
  id: string;
  label: string;
  blurb: string;
  need: number;
  have: number;
  earned: boolean;
}

export interface BadgeInputs {
  saved: number;
  steps: number;
  submitted: number;
  /** How many distinct subject categories the student has saved from. */
  categories: number;
}

export function badgeProgress(inputs: BadgeInputs): BadgeProgress[] {
  return BADGES.map((b) => {
    const have = inputs[b.metric];
    return {
      id: b.id,
      label: b.label,
      blurb: b.blurb,
      need: b.need,
      have,
      earned: have >= b.need,
    };
  });
}

export const earnedCount = (list: BadgeProgress[]): number => list.filter((b) => b.earned).length;
