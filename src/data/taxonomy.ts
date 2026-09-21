/**
 * ============================================================================
 *  THE SHARED VOCABULARY
 * ============================================================================
 *
 * Everything a student can pick in the quiz, declared once, so adding a track
 * or a skill goal is a single edit rather than a hunt through components.
 *
 * Each entry carries the keywords used to match real listings. That is what
 * keeps the recommendations honest: a track only claims a program when the
 * program's own text supports it, and a track with nothing behind it renders
 * as an explicit empty state rather than silently returning nothing.
 */

import type { Category } from "@/data/programs";

/* -------------------------------------------------------------------------- */
/*  Interest tracks                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Tracks are finer-grained than the six catalogue categories: a student thinks
 * "robotics", not "STEM". A track matches when the program is in one of its
 * categories AND its text hits one of the keywords — or, for a track with no
 * keywords, on the category alone.
 */
export interface InterestOption {
  id: string;
  label: string;
  blurb: string;
  /** Pixel-badge glyph. One character, rendered in the display face. */
  glyph: string;
  categories: Category[];
  /** Lower-case substrings matched against the listing's own text. */
  keywords?: string[];
}

export const INTERESTS: InterestOption[] = [
  {
    id: "robotics",
    label: "Robotics & Engineering",
    blurb: "Build things that move",
    glyph: "⚙",
    categories: ["STEM"],
    keywords: ["robot", "engineering", "mechatronic", "design challenge", "aerospace", "bridge"],
  },
  {
    id: "coding",
    label: "Coding & Software",
    blurb: "Programming, apps, algorithms",
    glyph: "{}",
    categories: ["STEM"],
    keywords: [
      "coding",
      "computing",
      "programming",
      "software",
      "hackathon",
      "cyber",
      "informatics",
      "machine learning",
      "big data",
      "data challenge",
      "app",
    ],
  },
  {
    id: "mathsci",
    label: "Math & Physical Science",
    blurb: "Contests, olympiads, theory",
    glyph: "∑",
    categories: ["STEM"],
    keywords: [
      "math",
      "olympiad",
      "physics",
      "chemistry",
      "astronomy",
      "quantum",
      "contest",
      "science fair",
    ],
  },
  {
    id: "biotech",
    label: "BioTech & Life Sciences",
    blurb: "Labs, genetics, the living world",
    glyph: "✿",
    categories: ["STEM", "Medicine"],
    keywords: [
      "biolog",
      "biotech",
      "bio",
      "genetic",
      "genom",
      "neuro",
      "life science",
      "ecolog",
      "environment",
      "laboratory",
      "science fair",
    ],
  },
  {
    id: "health",
    label: "Health & Medicine",
    blurb: "Hospitals, public health, care",
    glyph: "✚",
    categories: ["Medicine"],
  },
  {
    id: "business",
    label: "Business & Entrepreneurship",
    blurb: "Startups, finance, case comps",
    glyph: "◈",
    categories: ["Business"],
  },
  {
    id: "civics",
    label: "Law, Civics & Debate",
    blurb: "Government, advocacy, argument",
    glyph: "§",
    categories: ["Law & Civics"],
  },
  {
    id: "writing",
    label: "Creative Writing & Media",
    blurb: "Journalism, film, storytelling",
    glyph: "✎",
    categories: ["Arts"],
    keywords: [
      "writing",
      "writer",
      "journalis",
      "poetry",
      "film",
      "media",
      "photograph",
      "storytelling",
      "literary",
      "essay",
    ],
  },
  {
    id: "arts",
    label: "Art, Music & Performance",
    blurb: "Studio, stage, portfolio",
    glyph: "♪",
    categories: ["Arts"],
    keywords: [
      "art",
      "music",
      "theatre",
      "dance",
      "perform",
      "visual",
      "portfolio",
      "studio",
      "improv",
      "design",
    ],
  },
  {
    id: "leadership",
    label: "Leadership & Service",
    blurb: "Councils, volunteering, community",
    glyph: "★",
    categories: ["Leadership"],
  },
  {
    id: "paidwork",
    label: "Paid Work & Internships",
    blurb: "Get paid while you learn",
    glyph: "$",
    categories: ["STEM", "Business", "Medicine", "Law & Civics", "Leadership", "Arts"],
    keywords: [
      "internship",
      "paid position",
      "summer job",
      "employment",
      "co-op",
      "job postings",
      "hiring",
    ],
  },
  {
    id: "trades",
    label: "Trades & Skilled Work",
    blurb: "Hands-on, certified, in demand",
    glyph: "⚒",
    categories: ["STEM", "Business", "Leadership"],
    keywords: [
      "trade",
      "apprentice",
      "skilled",
      "construction",
      "carpent",
      "weld",
      "electric",
      "technician",
      "automotive",
      "culinary",
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Skill goals                                                                */
/* -------------------------------------------------------------------------- */

export interface SkillOption {
  id: string;
  label: string;
  blurb: string;
  glyph: string;
  keywords: string[];
  /** Categories that count as a soft match even without a keyword hit. */
  categories: Category[];
}

export const SKILLS: SkillOption[] = [
  {
    id: "leadership",
    label: "Leadership",
    blurb: "Running a team or a project",
    glyph: "★",
    keywords: ["leadership", "lead a", "council", "ambassador", "mentor", "captain", "organis"],
    categories: ["Leadership"],
  },
  {
    id: "coding",
    label: "Coding & Python",
    blurb: "Programming and algorithms",
    glyph: "{}",
    keywords: [
      "coding",
      "computing",
      "programming",
      "software",
      "python",
      "hackathon",
      "machine learning",
      "robotic",
      "informatics",
      "cyber",
    ],
    categories: ["STEM"],
  },
  {
    id: "speaking",
    label: "Public Speaking",
    blurb: "Debate, pitching, presenting",
    glyph: "◗",
    keywords: [
      "debate",
      "speech",
      "speaking",
      "model united nations",
      "pitch",
      "present",
      "oratory",
      "mock trial",
    ],
    categories: ["Law & Civics"],
  },
  {
    id: "writing",
    label: "Creative Writing",
    blurb: "Essays, journalism, story",
    glyph: "✎",
    keywords: [
      "writing",
      "writer",
      "essay",
      "journalis",
      "poetry",
      "storytelling",
      "publication",
      "literary",
    ],
    categories: ["Arts"],
  },
  {
    id: "portfolio",
    label: "Portfolio Building",
    blurb: "Work you can actually show",
    glyph: "▤",
    keywords: [
      "portfolio",
      "design",
      "prototype",
      "build",
      "maker",
      "exhibit",
      "showcase",
      "film",
      "submission",
    ],
    categories: ["Arts", "STEM"],
  },
  {
    id: "research",
    label: "Research",
    blurb: "Lab work, data, method",
    glyph: "◎",
    keywords: ["research", "laboratory", "lab ", "scientific", "investigat", "thesis", "study"],
    categories: ["STEM", "Medicine"],
  },
  {
    id: "entrepreneurship",
    label: "Entrepreneurship",
    blurb: "Building a venture",
    glyph: "◈",
    keywords: [
      "entrepreneur",
      "startup",
      "start-up",
      "business plan",
      "venture",
      "case competition",
      "innovation",
      "pitch",
    ],
    categories: ["Business"],
  },
  {
    id: "community",
    label: "Community Organising",
    blurb: "Volunteering and advocacy",
    glyph: "❋",
    keywords: [
      "volunteer",
      "community",
      "advocacy",
      "outreach",
      "service",
      "non-profit",
      "charity",
      "youth council",
    ],
    categories: ["Leadership", "Law & Civics"],
  },
];

/* -------------------------------------------------------------------------- */
/*  Budget + time                                                              */
/* -------------------------------------------------------------------------- */

export type BudgetPreference = "free" | "aid" | "paid" | "any";

export const BUDGET_OPTIONS: {
  id: BudgetPreference;
  label: string;
  blurb: string;
  glyph: string;
}[] = [
  {
    id: "free",
    label: "Free only",
    glyph: "◉",
    blurb: "No cost — including positions that pay you",
  },
  {
    id: "aid",
    label: "Free or need-based aid",
    glyph: "◑",
    blurb: "Include fees with bursaries or waivers",
  },
  {
    id: "paid",
    label: "Cost is not a barrier",
    glyph: "○",
    blurb: "Show everything, full-fee included",
  },
  {
    id: "any",
    label: "Not sure yet",
    glyph: "?",
    blurb: "Show everything and label the cost clearly",
  },
];

export type CommitmentPreference = "light" | "medium" | "intensive" | "any";

export const COMMITMENT_OPTIONS: {
  id: CommitmentPreference;
  label: string;
  blurb: string;
  glyph: string;
}[] = [
  {
    id: "light",
    label: "A few hours",
    glyph: "▁",
    blurb: "One-off contests, submissions, single events",
  },
  { id: "medium", label: "A few weeks", glyph: "▄", blurb: "Short courses and week-long programs" },
  {
    id: "intensive",
    label: "A summer or a year",
    glyph: "█",
    blurb: "Residencies, internships, year-long roles",
  },
  { id: "any", label: "Open to anything", glyph: "▚", blurb: "Do not filter on time" },
];

/* -------------------------------------------------------------------------- */
/*  Lookups                                                                    */
/* -------------------------------------------------------------------------- */

export const INTERESTS_BY_ID = new Map(INTERESTS.map((i) => [i.id, i]));
export const SKILLS_BY_ID = new Map(SKILLS.map((s) => [s.id, s]));

/** Every category implied by a set of chosen tracks. */
export function categoriesForInterests(interestIds: string[]): Category[] {
  const out = new Set<Category>();
  for (const id of interestIds) {
    const track = INTERESTS_BY_ID.get(id);
    if (!track) continue;
    for (const c of track.categories) out.add(c);
  }
  return [...out];
}

/**
 * Does a listing belong to this track?
 *
 * Category alone is enough for a broad track; a narrow one must also hit a
 * keyword in the listing's own text. This is what stops "Robotics" from
 * returning every STEM program in the catalogue.
 */
export function programMatchesTrack(
  track: InterestOption,
  category: Category,
  haystack: string,
): boolean {
  if (!track.categories.includes(category)) return false;
  if (!track.keywords || track.keywords.length === 0) return true;
  return track.keywords.some((k) => haystack.includes(k));
}
