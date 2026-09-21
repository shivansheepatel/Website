/**
 * Content for the counsellor & parent hub (`/resources`).
 *
 * Kept as data rather than JSX so a non-developer can edit the guidance
 * without touching a component, and so a fork can swap in board-specific
 * advice by editing one file.
 */

export interface Checklist {
  id: string;
  title: string;
  audience: "student" | "counsellor" | "parent";
  intro: string;
  items: { text: string; detail?: string }[];
}

export interface Article {
  id: string;
  title: string;
  readingMinutes: number;
  audience: "student" | "counsellor" | "parent";
  standfirst: string;
  body: string[];
}

export const CHECKLISTS: Checklist[] = [
  {
    id: "application-checklist",
    title: "Before you hit submit",
    audience: "student",
    intro:
      "Work through this the day before a deadline, not the hour before. Most rejected applications fail on something in this list rather than on the student.",
    items: [
      {
        text: "Re-read the eligibility line on the official page",
        detail:
          "Grade, region and age cut-offs change between cycles more often than people expect.",
      },
      {
        text: "Confirm the deadline in the organiser's own words",
        detail:
          "Not here, not a Reddit post — their page. Note the time zone and whether it closes at 11:59pm or 5pm.",
      },
      { text: "Ask for references at least two weeks out" },
      {
        text: "Write the 'why you' answer last",
        detail: "It is the only part nobody else can write, so give it your freshest attention.",
      },
      { text: "Have one adult who is not your parent read it once" },
      { text: "Save a copy of everything you submitted" },
      {
        text: "Put the decision date in your calendar",
        detail: "So a silent inbox in April does not turn into a missed acceptance.",
      },
    ],
  },
  {
    id: "counsellor-checklist",
    title: "Running this with a caseload",
    audience: "counsellor",
    intro: "How to use the directory with a whole cohort rather than one student at a time.",
    items: [
      {
        text: "Filter to free and paid-position listings first",
        detail:
          "It removes the cost conversation and surfaces the programs with the widest access.",
      },
      {
        text: "Print the term view from a student's roadmap",
        detail:
          "The roadmap page prints cleanly to PDF — one page per student, ready for a meeting.",
      },
      {
        text: "Check the verification chip before you recommend anything",
        detail:
          "Estimated dates are inferred from previous years and need confirming with the organiser.",
      },
      { text: "Flag wrong deadlines through the report link so every school benefits" },
      {
        text: "Revisit in September and January",
        detail: "Those are the two months when most of the following year's deadlines get posted.",
      },
    ],
  },
  {
    id: "parent-checklist",
    title: "Helping without taking over",
    audience: "parent",
    intro:
      "The research is genuinely useful; the writing has to be theirs. Admissions readers can tell.",
    items: [
      { text: "Offer to be the deadline keeper, not the editor" },
      {
        text: "Ask about the cost line before the excitement builds",
        detail:
          "Many programs have bursaries that are never advertised on the front page — ask directly.",
      },
      { text: "Budget for travel and incidentals, not just the program fee" },
      {
        text: "Let one application be genuinely theirs, mistakes included",
        detail: "A slightly rougher essay in their own voice beats a polished one in yours.",
      },
      { text: "Plan for the no — most students are rejected from most things" },
    ],
  },
];

export const ARTICLES: Article[] = [
  {
    id: "what-actually-counts",
    title: "What actually counts on an application",
    readingMinutes: 4,
    audience: "student",
    standfirst:
      "Depth beats breadth, and a long list of one-day events reads worse than one thing you stuck with.",
    body: [
      "Admissions readers and scholarship committees are looking for evidence that you chose something and kept going. Two years in one club where you ended up running something says more than nine clubs you attended twice.",
      "That has a practical consequence for how you use this site: do not try to fill every term. Pick one anchor commitment per year — the thing you would still do if it did not count for anything — and let the competitions and one-off programs orbit around it.",
      "The second thing readers look for is specificity. 'Interested in engineering' is invisible. 'Spent a summer at DEEP, then built a water-quality sensor for the creek behind my school' is a person. Programs are the raw material for that kind of specificity, not the point of it.",
      "Finally: the things that are free and local count exactly as much as the expensive residential ones. A committee is reading for what you did with an opportunity, not what the opportunity cost.",
    ],
  },
  {
    id: "confirmed-vs-estimated",
    title: "Why some deadlines say 'estimated'",
    readingMinutes: 2,
    audience: "counsellor",
    standfirst:
      "Roughly a third of programs have not posted this cycle's dates yet. Here is how to read the labels.",
    body: [
      "A verified date is one the organiser has published for the current cycle and that our freshness check has confirmed recently. Plan around these.",
      "An estimated date is carried forward from a previous cycle because this year's has not appeared. It is a planning aid, not a commitment — treat it as 'roughly this time of year' and check the official page before you build anything around it.",
      "'Not posted' means the program genuinely runs but has no single closing date: rolling intake, until-full postings, or dates set locally by each school. These are not missing data; they are accurately represented uncertainty.",
      "'Needs re-checking' means our own last verification is older than the freshness window. It is a flag on us, not on the program.",
    ],
  },
  {
    id: "paying-for-it",
    title: "The money conversation",
    readingMinutes: 3,
    audience: "parent",
    standfirst:
      "Fee waivers and bursaries are far more common than the marketing suggests — but you usually have to ask.",
    body: [
      "Most university-run and non-profit programs hold back a meaningful share of their places for need-based aid, and a surprising number of those places go unclaimed because families never ask.",
      "Ask before applying, not after acceptance. The question is simply: 'Is need-based financial assistance available, and what does the process look like?' Programs that have it will tell you plainly.",
      "Watch for the costs outside the fee — travel, a laptop, a deposit held until the end, spending money for a month away. These sink more placements than tuition does.",
      "And note the listings tagged as paid positions. Those are jobs: the student is paid to be there, which changes the calculation entirely for families where a summer of unpaid enrichment is not realistic.",
    ],
  },
];
