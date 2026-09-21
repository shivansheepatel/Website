/**
 * Seed sources for discovery.
 *
 * HONESTY NOTE, and please read it before your first run: the list below is a
 * *starting point I wrote from general knowledge of the Ontario/Canada youth
 * program landscape*, not a verified crawl manifest. I could not reach these
 * pages from the environment this engine was written in. Some URLs will have
 * moved. `npm run engine:seeds` fetches every one of them, reports status and
 * robots.txt verdict, and prints a checklist — run that first, delete what is
 * dead, and treat the surviving list as yours.
 *
 * The engine never invents a source at runtime. Discovery is: these hubs,
 * followed exactly one hop, plus an optional search API. It does not scrape
 * Google or Bing result pages — that breaks their terms, and an engine that
 * starts by breaking terms is not one you can point a school board at.
 */
import type { SeedSource } from "./types.mts";

/** One hop out of these. Each is a page that *lists* programs. */
export const SEEDS: SeedSource[] = [
  // ---- University youth / outreach offices -------------------------------
  {
    id: "uoft-outreach",
    label: "University of Toronto — youth outreach & summer programs",
    url: "https://www.utoronto.ca/community-support/community-programs",
    kind: "hub",
    maxLinks: 30,
    region: "ON",
  },
  {
    id: "uwaterloo-outreach",
    label: "University of Waterloo — outreach programs for youth",
    url: "https://uwaterloo.ca/engineering-outreach/",
    kind: "hub",
    maxLinks: 30,
    region: "ON",
  },
  {
    id: "mcmaster-youth",
    label: "McMaster University — youth programs",
    url: "https://future.mcmaster.ca/",
    kind: "hub",
    maxLinks: 25,
    region: "ON",
  },
  {
    id: "queens-enrichment",
    label: "Queen's University — Enrichment Studies Unit",
    url: "https://esu.queensu.ca/",
    kind: "hub",
    maxLinks: 25,
    region: "ON",
  },
  {
    id: "western-youth",
    label: "Western University — youth & pre-university programs",
    url: "https://www.uwo.ca/",
    kind: "hub",
    followPattern: /(youth|summer|outreach|high.?school)/i,
    maxLinks: 20,
    region: "ON",
  },

  // ---- National competitions & STEM/Arts bodies --------------------------
  {
    id: "youth-science-canada",
    label: "Youth Science Canada — fairs and challenges",
    url: "https://youthscience.ca/",
    kind: "hub",
    maxLinks: 25,
  },
  {
    id: "cemc",
    label: "CEMC — Canadian math contests (Waterloo)",
    url: "https://www.cemc.uwaterloo.ca/contests/contests.html",
    kind: "listing",
    maxLinks: 30,
  },
  {
    id: "skills-ontario",
    label: "Skills Ontario — trades & technology competitions",
    url: "https://www.skillsontario.com/",
    kind: "hub",
    maxLinks: 25,
    region: "ON",
    notes: "Highest-value seed for the Trades gap — the catalogue has 1 listing there.",
  },
  {
    id: "shad",
    label: "SHAD Canada",
    url: "https://www.shad.ca/",
    kind: "hub",
    maxLinks: 15,
  },

  // ---- Government & board listings ---------------------------------------
  {
    id: "ontario-jobs-youth",
    label: "Ontario — youth employment and summer jobs",
    url: "https://www.ontario.ca/page/summer-jobs-students",
    kind: "hub",
    maxLinks: 25,
    region: "ON",
  },
  {
    id: "canada-summer-jobs",
    label: "Government of Canada — Youth employment",
    url: "https://www.canada.ca/en/services/jobs/opportunities/student.html",
    kind: "hub",
    maxLinks: 25,
  },

  // ---- Non-profit youth initiatives --------------------------------------
  {
    id: "ted-rogers-volunteer",
    label: "Volunteer Toronto — youth opportunities",
    url: "https://www.volunteertoronto.ca/",
    kind: "hub",
    followPattern: /(youth|teen|student)/i,
    maxLinks: 20,
    region: "ON",
  },
  {
    id: "duke-of-ed",
    label: "Duke of Edinburgh's International Award — Canada",
    url: "https://www.dukeofed.org/",
    kind: "hub",
    maxLinks: 15,
  },
];

/**
 * Search queries used when SEARCH_PROVIDER is configured. Kept narrow and
 * dated on purpose — a broad query returns listicles and ad farms, and every
 * junk result costs an LLM call.
 */
export function searchQueries(year: number): string[] {
  return [
    `Ontario high school summer program ${year} application deadline`,
    `Ontario high school student internship ${year} apply grade 11 12`,
    `Canada high school competition ${year} registration deadline`,
    `university summer academy high school students Ontario ${year}`,
    `paid co-op youth program Ontario ${year} high school`,
    `skilled trades youth program Ontario ${year} high school`,
  ];
}

/** Hosts we will never crawl: search engines, social, aggregators, paywalls. */
export const HOST_DENYLIST = [
  "google.",
  "bing.",
  "duckduckgo.",
  "yandex.",
  "facebook.com",
  "instagram.com",
  "x.com",
  "twitter.com",
  "tiktok.com",
  "linkedin.com",
  "pinterest.",
  "reddit.com",
  "youtube.com",
  "youtu.be",
  "amazon.",
  "ebay.",
];

/** Paths that are never a program listing. Cheap pre-filter before fetching. */
export const PATH_DENYLIST =
  /\/(login|signin|sign-in|register|cart|checkout|privacy|terms|accessibility|sitemap|search|tag|category|author|feed|rss|wp-admin|wp-login)(\/|$|\?)/i;

/** File extensions we do not try to read as a program page. */
export const EXT_DENYLIST =
  /\.(pdf|docx?|xlsx?|pptx?|zip|jpe?g|png|gif|svg|webp|mp4|mp3|ics)(\?|$)/i;

/**
 * Registrable domain ("public suffix + 1"), good enough without pulling in the
 * full PSL. Handles the two-label TLDs that actually show up here: .co.uk,
 * .gc.ca, .on.ca, .ac.uk, .edu.au and friends.
 */
const TWO_LABEL =
  /\.(co|com|net|org|gov|edu|ac|gc|on|bc|ab|qc|ns|nb|mb|sk|nl|pe|nt|nu|yt|sch|nhs)\.[a-z]{2}$/i;

export function registrableDomain(input: string): string {
  let host: string;
  try {
    host = new URL(input).hostname.toLowerCase();
  } catch {
    host = String(input).toLowerCase();
  }
  host = host.replace(/^www\./, "");
  const parts = host.split(".");
  if (parts.length <= 2) return host;
  const lastTwo = "." + parts.slice(-2).join(".");
  const take = TWO_LABEL.test(lastTwo) ? 3 : 2;
  return parts.slice(-take).join(".");
}

/** True when a URL is worth spending a fetch on. */
export function crawlable(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  const host = u.hostname.toLowerCase();
  if (HOST_DENYLIST.some((d) => host.includes(d))) return false;
  if (PATH_DENYLIST.test(u.pathname)) return false;
  if (EXT_DENYLIST.test(u.pathname)) return false;
  // Query-heavy URLs are almost always faceted search, not a listing.
  if (u.searchParams.toString().length > 120) return false;
  return true;
}

/** Strip trackers and fragments so two links to the same page hash alike. */
export function canonicalUrl(url: string): string {
  const u = new URL(url);
  u.hash = "";
  for (const k of [...u.searchParams.keys()]) {
    if (/^(utm_|fbclid|gclid|mc_cid|mc_eid|ref|source)/i.test(k)) u.searchParams.delete(k);
  }
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
  if (u.pathname !== "/" && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
  return u.toString();
}
