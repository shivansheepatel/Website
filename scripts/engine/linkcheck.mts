/**
 * Daily link health.
 *
 * This is the cheap job — no LLM, no rendering. It runs every day against
 * every active listing while the full crawl runs weekly.
 *
 * The important design point is that ONE failure is never "dead". Sites go
 * down, WAFs rate-limit bots, university IT does maintenance on a Sunday.
 * A link is marked dead only after it fails on two different days, and the
 * state that remembers that lives in `data/link-health.json`, committed to the
 * repo — which is also how you get a free audit trail of every outage.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { LinkHealth } from "./types.mts";
import { USER_AGENT } from "./fetch.mts";

const STATE_PATH = "data/link-health.json";
const CONCURRENCY = 6;
const TIMEOUT_MS = 15_000;

interface HealthState {
  [url: string]: {
    consecutiveFailures: number;
    firstFailedAt: string | null;
    lastCheckedAt: string;
    lastStatus: number | null;
    verdict: LinkHealth["verdict"];
  };
}

async function loadState(): Promise<HealthState> {
  try {
    return JSON.parse(await readFile(STATE_PATH, "utf8")) as HealthState;
  } catch {
    return {};
  }
}

async function saveState(state: HealthState): Promise<void> {
  await mkdir(dirname(STATE_PATH), { recursive: true });
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
}

async function probe(
  url: string,
): Promise<{ status: number | null; finalUrl: string; error?: string }> {
  const attempt = async (method: "HEAD" | "GET") => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        signal: ctrl.signal,
        headers: { "user-agent": USER_AGENT, accept: "text/html,*/*" },
      });
      // Don't download the body of a GET we only needed the status for.
      if (method === "GET") await res.body?.cancel();
      return { status: res.status, finalUrl: res.url || url };
    } finally {
      clearTimeout(t);
    }
  };

  try {
    const head = await attempt("HEAD");
    // Plenty of servers refuse HEAD but serve GET fine. 405/403/501 -> retry.
    if (head.status === 405 || head.status === 501 || head.status === 403)
      return await attempt("GET");
    return head;
  } catch (err) {
    try {
      return await attempt("GET");
    } catch (err2) {
      return {
        status: null,
        finalUrl: url,
        error: (err2 as Error).message || (err as Error).message,
      };
    }
  }
}

function verdictFor(
  status: number | null,
  failures: number,
  redirected: boolean,
): LinkHealth["verdict"] {
  if (status && status >= 200 && status < 300) return redirected ? "redirected" : "ok";
  if (status === 429 || status === 503) return "suspect"; // rate limit, not death
  if (failures >= 2) return "dead";
  return "suspect";
}

export async function checkLinks(
  urls: string[],
  today = new Date().toISOString(),
): Promise<LinkHealth[]> {
  const state = await loadState();
  const unique = [...new Set(urls.filter(Boolean))];
  const results: LinkHealth[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < unique.length) {
      const url = unique[cursor++]!;
      const { status, finalUrl, error } = await probe(url);
      const ok = Boolean(status && status >= 200 && status < 400);
      const prior = state[url];
      const sameDay = prior?.lastCheckedAt.slice(0, 10) === today.slice(0, 10);
      const failures = ok ? 0 : (prior?.consecutiveFailures ?? 0) + (sameDay ? 0 : 1);
      const redirected = finalUrl.replace(/\/$/, "") !== url.replace(/\/$/, "");
      const verdict = verdictFor(status, failures, redirected);

      state[url] = {
        consecutiveFailures: failures,
        firstFailedAt: ok ? null : (prior?.firstFailedAt ?? today),
        lastCheckedAt: today,
        lastStatus: status,
        verdict,
      };
      results.push({
        url,
        ok,
        status,
        verdict,
        checkedAt: today,
        ...(redirected ? { redirectedTo: finalUrl } : {}),
        ...(error ? { error } : {}),
      });
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, unique.length) }, worker));
  await saveState(state);
  return results;
}

/** One-shot check used inline during a crawl. Does not touch the state file. */
export async function checkOne(url: string): Promise<boolean | null> {
  if (!url) return null;
  try {
    const { status } = await probe(url);
    return status != null && status >= 200 && status < 400;
  } catch {
    return null;
  }
}
