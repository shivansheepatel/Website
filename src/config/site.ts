/**
 * ============================================================================
 *  SITE CONFIGURATION — the one file a fork edits.
 * ============================================================================
 *
 * Change the values below and the whole site is yours: name, region, contact,
 * mascot, featured categories, urgency thresholds, feature toggles.
 *
 * Colours, fonts and motion tokens live in `src/styles.css` (the THEME block
 * at the top) because they are CSS custom properties, not TypeScript.
 */

/* -------------------------------------------------------------------------- */
/*  Identity                                                                   */
/* -------------------------------------------------------------------------- */

export const SITE = {
  /** Header, page titles, calendar feed. */
  name: "Ontario Student Opportunities",

  /** Used where the full name will not fit, and in .ics UIDs. */
  shortName: "OSO",

  tagline: "Programs, competitions, scholarships and paid positions for high school students.",

  /** Used in body copy so the region is never hard-coded in a component. */
  region: "Ontario",

  /** Canonical origin, no trailing slash. Leave "" while developing. */
  url: "",

  /**
   * Where corrections and share requests are sent.
   *
   * ⚠️ CHANGE THIS before launch. The default is a placeholder domain nobody
   * owns, so every message a student sends will bounce.
   */
  contactEmail: "hello@ontariostudentopportunities.ca",

  /** Grade levels this deployment serves. Drives the quiz and the filters. */
  grades: [9, 10, 11, 12] as const,

  disclaimer:
    "Deadlines change without notice — always confirm on the official site before you apply.",
} as const;

/* -------------------------------------------------------------------------- */
/*  Companion mascot                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The guide character. Rename it, mute it, or switch its accent here — every
 * line of dialogue is written against `MASCOT.name`, so a fork that prefers
 * "Scout" changes one string.
 *
 * `enabled: false` falls back to a plain headed quiz with no character, which
 * is the right call for a deployment aimed at counsellors rather than students.
 */
export const MASCOT = {
  enabled: true,
  name: "Byte",
  /** One line under the name in the hero. */
  role: "your application copilot",
  /** Shown on the home page hero button. */
  callToAction: "Start your journey with Byte",
  /** Accent token used for the sprite's body. See --arcade-* in styles.css. */
  accent: "var(--mascot)",
} as const;

/* -------------------------------------------------------------------------- */
/*  Home page copy                                                             */
/* -------------------------------------------------------------------------- */

export const HERO = {
  eyebrow: "Free · No account · No tracking",
  headline: "Level up your high school years.",
  subhead:
    "Every listing links straight to the official application page, with the deadline marked verified or estimated so you know what to trust.",
  quizPrompt: "Find your custom path in 60 seconds",
  quizSubPrompt:
    "Four questions. No sign-up. Byte builds you a term-by-term plan you can change any time.",
} as const;

/* -------------------------------------------------------------------------- */
/*  Feature toggles                                                            */
/* -------------------------------------------------------------------------- */

export const FEATURES = {
  /** Open the quiz automatically on a student's first visit. */
  autoOpenQuiz: true,
  /** The "closing soon" urgency rail on the home page. */
  closingSoonTicker: true,
  /** .ics calendar downloads. */
  calendarExport: true,
  /** Printable / PDF roadmap and checklists. */
  printExport: true,
  /** The student dashboard at /dashboard. */
  dashboard: true,
  /** The counsellor & parent portal at /counselors. */
  counselorPortal: true,
  /** Per-program preparation checklists. */
  prepChecklists: true,
  /** Skill badges earned by completing prep steps. */
  badges: true,
  /** The Discord companion bot button (also needs DISCORD.clientId). */
  discordBot: true,
} as const;

/* -------------------------------------------------------------------------- */
/*  Lifecycle thresholds — all values in days                                  */
/* -------------------------------------------------------------------------- */

export const LIFECYCLE = {
  /** Applications opening within this many days count as "opening soon". */
  openingSoonDays: 60,
  /** At or under this many days left, a deadline is urgent (coral). */
  closingSoonDays: 21,
  /** At or under this, it is approaching (amber). */
  approachingDays: 60,
  /** How far ahead the home page ticker looks. */
  tickerHorizonDays: 75,
  /**
   * A listing unverified for longer than this is shown as "needs re-checking".
   * Keep it in step with how often the sync workflow runs.
   */
  staleAfterDays: 45,
} as const;

/* -------------------------------------------------------------------------- */
/*  Preparation checklist                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The default prep steps attached to every program. A student ticks these off
 * inside the program page; progress is per-program and saved in their browser.
 *
 * `appliesTo` limits a step to programs that need it — there is no point
 * asking for a transcript on a one-day contest.
 */
export const PREP_STEPS: {
  id: string;
  label: string;
  hint: string;
  appliesTo?: "all" | "intensive" | "paid";
}[] = [
  {
    id: "read-eligibility",
    label: "Re-read the eligibility rules",
    hint: "On the organiser's own page, not here. Grade and region cut-offs move between cycles.",
  },
  {
    id: "diarise",
    label: "Put the deadline in your calendar",
    hint: "With the time zone and a reminder a week out.",
  },
  {
    id: "transcript",
    label: "Request your transcript",
    hint: "Guidance offices need lead time, especially in January.",
    appliesTo: "intensive",
  },
  {
    id: "reference",
    label: "Ask a teacher for a reference",
    hint: "Two weeks' notice minimum. Give them your draft so they can be specific.",
  },
  {
    id: "draft-essay",
    label: "Draft the written answers",
    hint: "Write the 'why you' answer last, when you are warmed up.",
  },
  {
    id: "aid",
    label: "Ask about need-based aid",
    hint: "Far more common than the marketing suggests — but you usually have to ask.",
    appliesTo: "paid",
  },
  {
    id: "review",
    label: "Have one adult read it once",
    hint: "Someone who is not your parent. Fresh eyes catch the obvious.",
  },
  {
    id: "submit",
    label: "Submit, and save a copy",
    hint: "Screenshot the confirmation. Note the decision date.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Skill badges                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Earned by doing real things, never by clicking around. Each badge names the
 * condition that unlocks it so nothing feels arbitrary.
 */
export const BADGES: {
  id: string;
  label: string;
  blurb: string;
  need: number;
  metric: "saved" | "steps" | "submitted" | "categories";
}[] = [
  { id: "scout", label: "Scout", blurb: "Saved your first opportunity", need: 1, metric: "saved" },
  {
    id: "shortlister",
    label: "Shortlister",
    blurb: "Five opportunities on your roadmap",
    need: 5,
    metric: "saved",
  },
  {
    id: "prepper",
    label: "Prepper",
    blurb: "Ticked off ten preparation steps",
    need: 10,
    metric: "steps",
  },
  {
    id: "generalist",
    label: "Generalist",
    blurb: "Saved programs across three subjects",
    need: 3,
    metric: "categories",
  },
  {
    id: "applicant",
    label: "Applicant",
    blurb: "Marked your first application submitted",
    need: 1,
    metric: "submitted",
  },
  {
    id: "campaigner",
    label: "Campaigner",
    blurb: "Three applications submitted",
    need: 3,
    metric: "submitted",
  },
];

/* -------------------------------------------------------------------------- */
/*  Discord companion bot                                                      */
/* -------------------------------------------------------------------------- */

export const DISCORD = {
  /** Public application ID — not a secret, and it survives token resets. */
  clientId: "1534005535735681198",
  /** Send Messages, Embed Links, Read Message History. */
  permissions: "52224",
} as const;

export const DISCORD_URL =
  FEATURES.discordBot && DISCORD.clientId
    ? `https://discord.com/oauth2/authorize?client_id=${DISCORD.clientId}&permissions=${DISCORD.permissions}&scope=bot%20applications.commands`
    : "";

/* -------------------------------------------------------------------------- */
/*  Storage                                                                    */
/* -------------------------------------------------------------------------- */

/** Bump a version suffix to invalidate everyone's saved state. */
export const STORAGE_KEYS = {
  profile: "sot.profile.v2",
  legacyProfile: "sot.profile.v1",
  legacyShortlist: "oso.shortlist.v1",
} as const;

/* -------------------------------------------------------------------------- */
/*  Back-compat                                                                */
/* -------------------------------------------------------------------------- */

/** @deprecated Use LIFECYCLE. Kept so older imports keep compiling. */
export const DEADLINE_RULES = LIFECYCLE;
