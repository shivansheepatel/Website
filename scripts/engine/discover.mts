/**
 * Discovery: how the engine finds programs nobody typed in.
 *
 * Two legal, terms-respecting channels:
 *
 *   1. Seeded hub crawl. Fetch a curated hub, take the links, keep the ones
 *      that look like a program page, follow them ONE hop. No recursion — a
 *      recursive crawler on a university domain will happily download 40,000
 *      course pages and bill you for the privilege.
 *
 *   2. A search API (Brave or Tavily). Both have free tiers and both permit
 *      programmatic use, which is exactly what scraping a Google or Bing
 *      results page does not. Optional: with no key, the engine runs on hubs
 *      alone and says so.
 */
import { fetchPage, isSnapshot } from "./fetch.mts";
import { SEEDS, canonicalUrl, crawlable, registrableDomain, searchQueries } from "./sources.mts";
import type { SeedSource } from "./types.mts";

export interface Candidate {
  url: string;
  domain: string;
  /** How we got here — shown in the PR body so a reviewer can judge the source. */
  via: string;
}

/** Link text / URL shapes that suggest an actual opportunity page. */
const PROMISING =
  /(program|summer|camp|academy|institute|internship|co-?op|competition|contest|challenge|scholarship|bursary|award|workshop|volunteer|youth|student|apply|application|fellowship|mentorship|bootcamp|placement)/i;

function looksPromising(url: string): boolean {
  return PROMISING.test(decodeURIComponent(new URL(url).pathname.replace(/[-_/]/g, " ")));
}

/** One hop out of one hub. */
export async function crawlHub(
  seed: SeedSource,
): Promise<{ candidates: Candidate[]; error?: string }> {
  const page = await fetchPage(seed.url);
  if (!isSnapshot(page)) return { candidates: [], error: page.error };

  const hubDomain = registrableDomain(page.finalUrl);
  const max = seed.maxLinks ?? 25;
  const out: Candidate[] = [];
  const seen = new Set<string>();

  for (const link of page.links) {
    if (out.length >= max) break;
    if (!crawlable(link)) continue;
    if (seed.followPattern && !seed.followPattern.test(link)) continue;
    // Stay on the hub's own domain unless the hub is explicitly a directory.
    const d = registrableDomain(link);
    if (seed.kind === "hub" && d !== hubDomain) continue;
    if (!looksPromising(link)) continue;
    const canon = canonicalUrl(link);
    if (canon === page.finalUrl || seen.has(canon)) continue;
    seen.add(canon);
    out.push({ url: canon, domain: d, via: `hub:${seed.id}` });
  }

  return { candidates: out };
}

/* ------------------------------------------------------------- search API */

interface SearchHit {
  url: string;
  title: string;
}

async function braveSearch(query: string, key: string): Promise<SearchHit[]> {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "15");
  url.searchParams.set("country", "CA");
  const res = await fetch(url, {
    headers: { "X-Subscription-Token": key, accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Brave search ${res.status}`);
  const json = (await res.json()) as { web?: { results?: { url: string; title: string }[] } };
  return (json.web?.results ?? []).map((r) => ({ url: r.url, title: r.title }));
}

async function tavilySearch(query: string, key: string): Promise<SearchHit[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ api_key: key, query, max_results: 15, search_depth: "basic" }),
  });
  if (!res.ok) throw new Error(`Tavily search ${res.status}`);
  const json = (await res.json()) as { results?: { url: string; title: string }[] };
  return (json.results ?? []).map((r) => ({ url: r.url, title: r.title }));
}

export async function searchDiscovery(
  year: number,
): Promise<{ candidates: Candidate[]; note: string }> {
  const brave = process.env["BRAVE_SEARCH_API_KEY"];
  const tavily = process.env["TAVILY_API_KEY"];
  if (!brave && !tavily) {
    return { candidates: [], note: "No search API key configured — hub crawl only." };
  }
  const provider = brave ? "brave" : "tavily";
  const out = new Map<string, Candidate>();

  for (const q of searchQueries(year)) {
    try {
      const hits = brave ? await braveSearch(q, brave) : await tavilySearch(q, tavily!);
      for (const hit of hits) {
        if (!crawlable(hit.url)) continue;
        const canon = canonicalUrl(hit.url);
        if (out.has(canon)) continue;
        out.set(canon, { url: canon, domain: registrableDomain(canon), via: `search:${provider}` });
      }
    } catch (err) {
      console.warn(`  search failed for "${q}": ${(err as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 1100)); // free tiers are ~1 req/s
  }
  return { candidates: [...out.values()], note: `${provider}: ${out.size} candidates` };
}

/** Everything, deduped, with known URLs removed. */
export async function discover(opts: {
  knownUrls: Set<string>;
  seeds?: SeedSource[];
  useSearch?: boolean;
  year?: number;
}): Promise<{ candidates: Candidate[]; log: string[] }> {
  const log: string[] = [];
  const found = new Map<string, Candidate>();

  for (const seed of opts.seeds ?? SEEDS) {
    const { candidates, error } = await crawlHub(seed);
    if (error) {
      log.push(`hub ${seed.id}: FAILED — ${error}`);
      continue;
    }
    log.push(`hub ${seed.id}: ${candidates.length} candidate links`);
    for (const c of candidates) if (!found.has(c.url)) found.set(c.url, c);
  }

  if (opts.useSearch !== false) {
    const { candidates, note } = await searchDiscovery(opts.year ?? new Date().getFullYear());
    log.push(`search: ${note}`);
    for (const c of candidates) if (!found.has(c.url)) found.set(c.url, c);
  }

  const fresh = [...found.values()].filter((c) => !opts.knownUrls.has(c.url));
  log.push(`discovery: ${found.size} unique, ${fresh.length} not already in the catalogue`);
  return { candidates: fresh, log };
}
