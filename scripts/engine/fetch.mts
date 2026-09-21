/**
 * Ingestion layer: polite fetching, robots.txt, content hashing, and turning
 * a messy page into the two things the extractor actually needs — readable
 * text, and any structured markup the organiser was kind enough to publish.
 *
 * Two deliberate choices:
 *
 *  1. `fetch` + cheerio is the default path. Playwright is the fallback, tried
 *     only when the static HTML yields too little text to be a real listing.
 *     Rendering every page would multiply the run time and the CI minutes for
 *     the ~10% of pages that need it.
 *
 *  2. We hash the *normalised text*, not the HTML. Almost every site changes
 *     its HTML daily (session ids, CSRF tokens, "12 people viewing"). Hashing
 *     raw HTML would call the LLM on every page every day, which is the whole
 *     cost of the pipeline, spent on nothing.
 */
import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import { canonicalUrl, registrableDomain } from "./sources.mts";

export const USER_AGENT =
  "OntarioStudentOpportunitiesBot/1.0 (+https://github.com/OWNER/apptrack-web; contact: office@us.sgvp.org)";

/** Minimum gap between two requests to the same host, ms. */
const HOST_DELAY_MS = Number(process.env["ENGINE_HOST_DELAY_MS"] ?? 2500);
const TIMEOUT_MS = Number(process.env["ENGINE_TIMEOUT_MS"] ?? 20_000);
const MAX_BYTES = 3_000_000;

const lastHit = new Map<string, number>();
const robotsCache = new Map<string, RobotsRules>();

interface RobotsRules {
  disallow: string[];
  allow: string[];
  crawlDelayMs: number | null;
}

async function sleep(ms: number) {
  if (ms > 0) await new Promise((r) => setTimeout(r, ms));
}

/** Serialise per host and honour Crawl-delay. */
async function throttle(host: string, crawlDelayMs: number | null) {
  const delay = Math.max(HOST_DELAY_MS, crawlDelayMs ?? 0);
  const prev = lastHit.get(host) ?? 0;
  const wait = prev + delay - Date.now();
  await sleep(wait);
  lastHit.set(host, Date.now());
}

async function rawFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-CA,en;q=0.9",
        ...(init.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(t);
  }
}

/**
 * Minimal robots.txt: the directives that actually gate a crawler. Wildcards
 * and `$` are supported because modern robots files use them heavily; the
 * longest matching rule wins, as the spec says.
 */
function parseRobots(txt: string): RobotsRules {
  const rules: RobotsRules = { disallow: [], allow: [], crawlDelayMs: null };
  let applies = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (field === "user-agent") {
      applies = value === "*" || USER_AGENT.toLowerCase().startsWith(value.toLowerCase());
    } else if (applies && field === "disallow" && value) {
      rules.disallow.push(value);
    } else if (applies && field === "allow" && value) {
      rules.allow.push(value);
    } else if (applies && field === "crawl-delay") {
      const n = Number(value);
      if (Number.isFinite(n)) rules.crawlDelayMs = n * 1000;
    }
  }
  return rules;
}

function ruleMatches(pattern: string, path: string): number {
  // Returns match length, or -1. `*` = any run, `$` = end anchor.
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const rx = new RegExp(
    "^" +
      body
        .split("*")
        .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*") +
      (anchored ? "$" : ""),
  );
  return rx.test(path) ? body.length : -1;
}

export async function robotsAllows(
  url: string,
): Promise<{ allowed: boolean; crawlDelayMs: number | null }> {
  if (process.env["ENGINE_IGNORE_ROBOTS"] === "1") {
    // Only ever set this against a site you own. It is not a default, and the
    // run log records it so a reviewer can see it happened.
    return { allowed: true, crawlDelayMs: null };
  }
  const u = new URL(url);
  const key = u.origin;
  let rules = robotsCache.get(key);
  if (!rules) {
    try {
      await throttle(u.hostname, null);
      const res = await rawFetch(key + "/robots.txt");
      rules = res.ok
        ? parseRobots(await res.text())
        : { disallow: [], allow: [], crawlDelayMs: null };
    } catch {
      // Unreachable robots.txt is not permission. Treat the host as closed for
      // this run rather than guessing; it will be retried tomorrow.
      rules = { disallow: ["/"], allow: [], crawlDelayMs: null };
    }
    robotsCache.set(key, rules);
  }
  const path = u.pathname + u.search;
  let bestAllow = -1;
  let bestDeny = -1;
  for (const p of rules.allow) bestAllow = Math.max(bestAllow, ruleMatches(p, path));
  for (const p of rules.disallow) bestDeny = Math.max(bestDeny, ruleMatches(p, path));
  return { allowed: bestDeny < 0 || bestAllow >= bestDeny, crawlDelayMs: rules.crawlDelayMs };
}

export interface PageSnapshot {
  url: string;
  finalUrl: string;
  domain: string;
  status: number;
  /** Normalised, whitespace-collapsed visible text. What the LLM reads. */
  text: string;
  /** sha256 of `text`. Change detection. */
  contentHash: string;
  title: string;
  /** Every JSON-LD object on the page, flattened out of @graph. */
  jsonLd: Record<string, unknown>[];
  /** <time datetime="..."> pairs — the cheapest structured date there is. */
  timeElements: { datetime: string; label: string }[];
  /** Outbound same-ish links, canonicalised and deduped. */
  links: string[];
  /** True when Playwright was used. */
  rendered: boolean;
  fetchedAt: string;
}

export function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/** Collapse a DOM into the text a human would actually read. */
function readable($: cheerio.CheerioAPI): string {
  $("script, style, noscript, svg, iframe, nav, footer, header, form").remove();
  // Keep list and heading boundaries — dates live in <li> and <dt> constantly,
  // and losing the break glues "Deadline" onto the previous sentence.
  $("li, p, h1, h2, h3, h4, h5, h6, dt, dd, tr, br, div").each((_, el) => {
    $(el).after("\n");
  });
  return $("body")
    .text()
    .replace(/[ \t ]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractJsonLd($: cheerio.CheerioAPI): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw.trim()) return;
    try {
      const parsed: unknown = JSON.parse(raw);
      const stack: unknown[] = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (stack.length) {
        const node = stack.pop();
        if (!node || typeof node !== "object") continue;
        const obj = node as Record<string, unknown>;
        if (Array.isArray(obj["@graph"])) stack.push(...(obj["@graph"] as unknown[]));
        else out.push(obj);
      }
    } catch {
      /* A broken JSON-LD block is common and not worth failing a crawl over. */
    }
  });
  return out;
}

function extractTimes($: cheerio.CheerioAPI): { datetime: string; label: string }[] {
  const out: { datetime: string; label: string }[] = [];
  $("time[datetime]").each((_, el) => {
    const dt = $(el).attr("datetime");
    if (!dt) return;
    const label = ($(el).parent().text() || $(el).text()).replace(/\s+/g, " ").trim().slice(0, 160);
    out.push({ datetime: dt, label });
  });
  return out.slice(0, 40);
}

function extractLinks($: cheerio.CheerioAPI, base: string): string[] {
  const seen = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:"))
      return;
    try {
      seen.add(canonicalUrl(new URL(href, base).toString()));
    } catch {
      /* relative junk */
    }
  });
  return [...seen];
}

/** Lazily loaded so a CI job that never renders does not pay for the import. */
async function renderWithPlaywright(url: string): Promise<string | null> {
  if (process.env["ENGINE_NO_BROWSER"] === "1") return null;
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({ userAgent: USER_AGENT });
      await page.goto(url, { waitUntil: "networkidle", timeout: TIMEOUT_MS });
      return await page.content();
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.warn(`  playwright unavailable or failed for ${url}: ${(err as Error).message}`);
    return null;
  }
}

/** Below this, the static HTML almost certainly did not contain the content. */
const THIN_TEXT_CHARS = 600;

export async function fetchPage(
  url: string,
): Promise<PageSnapshot | { error: string; status: number | null }> {
  const canon = canonicalUrl(url);
  const u = new URL(canon);
  const { allowed, crawlDelayMs } = await robotsAllows(canon);
  if (!allowed) return { error: "disallowed by robots.txt", status: null };

  await throttle(u.hostname, crawlDelayMs);
  let res: Response;
  try {
    res = await rawFetch(canon);
  } catch (err) {
    return { error: (err as Error).message, status: null };
  }
  if (!res.ok) return { error: `HTTP ${res.status}`, status: res.status };

  const ctype = res.headers.get("content-type") ?? "";
  if (!/text\/html|application\/xhtml/i.test(ctype)) {
    return { error: `not html (${ctype.split(";")[0]})`, status: res.status };
  }

  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) return { error: "page too large", status: res.status };
  let html = new TextDecoder("utf-8").decode(buf);

  let $ = cheerio.load(html);
  let text = readable($);
  let rendered = false;

  if (text.length < THIN_TEXT_CHARS) {
    const painted = await renderWithPlaywright(canon);
    if (painted) {
      html = painted;
      $ = cheerio.load(html);
      const t2 = readable($);
      if (t2.length > text.length) {
        text = t2;
        rendered = true;
      }
    }
  }

  return {
    url: canon,
    finalUrl: canonicalUrl(res.url || canon),
    domain: registrableDomain(res.url || canon),
    status: res.status,
    text,
    contentHash: hashText(text),
    title: ($("title").first().text() || "").replace(/\s+/g, " ").trim(),
    jsonLd: extractJsonLd($),
    timeElements: extractTimes($),
    links: extractLinks($, res.url || canon),
    rendered,
    fetchedAt: new Date().toISOString(),
  };
}

export function isSnapshot(x: PageSnapshot | { error: string }): x is PageSnapshot {
  return !("error" in x);
}
