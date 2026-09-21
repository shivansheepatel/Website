/**
 * Deduplication.
 *
 * The exact fingerprint the spec asks for: normalised title + organisation +
 * registrable domain. That is the *primary* key, and it is strict — it must
 * never merge two genuinely different programs run by the same university.
 *
 * But a strict fingerprint alone lets duplicates through, because organisers
 * rename things ("Summer Academy" -> "Summer Institute") and move them between
 * subdomains. So there is a second, softer pass: same domain + high title
 * similarity + overlapping dates => flag as a *probable* duplicate and send it
 * to review. It never merges on its own. A wrongly merged pair silently hides
 * a real program from students, which is worse than a duplicate they can see.
 */
import { createHash } from "node:crypto";
import { registrableDomain } from "./sources.mts";

/** Words that carry no identity and differ between editions of one program. */
const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "of",
  "for",
  "at",
  "in",
  "on",
  "to",
  "with",
  "program",
  "programme",
  "summer",
  "annual",
  "official",
  "online",
  "virtual",
  "students",
  "student",
  "youth",
  "high",
  "school",
  "secondary",
  "2024",
  "2025",
  "2026",
  "2027",
  "2028",
  "2029",
]);

export function normalizeTitle(raw: string): string {
  return (
    raw
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      // Roman-numeral-ish and ordinal edition markers: "23rd Annual", "Vol. II"
      .replace(/\b\d+(st|nd|rd|th)\b/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((w) => w && !STOPWORDS.has(w))
      .sort() // word order should not create a new identity
      .join(" ")
      .trim()
  );
}

export function normalizeOrg(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(
      /\b(university|universite|college|institute|faculty|department|dept|school|the|of|at|inc|ltd)\b/g,
      " ",
    )
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .sort()
    .join(" ")
    .trim();
}

/** The fingerprint. Stable across crawls, cheap to index, safe to compare. */
export function fingerprint(input: { title: string; organization: string; url: string }): string {
  const t = normalizeTitle(input.title);
  const o = normalizeOrg(input.organization);
  const d = registrableDomain(input.url);
  return `${t}|${o}|${d}`;
}

export function fingerprintId(fp: string): string {
  return createHash("sha1").update(fp).digest("hex").slice(0, 16);
}

/* ------------------------------------------------------- fuzzy second pass */

function bigrams(s: string): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
  return out;
}

/** Dice coefficient on character bigrams: 0..1. Cheap and good on short names. */
export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const A = bigrams(a),
    B = bigrams(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const g of A) if (B.has(g)) shared++;
  return (2 * shared) / (A.size + B.size);
}

/**
 * Title similarity. Dice on bigrams alone punishes length differences hard —
 * "Summer Engineering Academy" vs "Summer Engineering Academy (Residential
 * Stream)" scores only 0.67, and a qualifier appended to a title is one of the
 * most common ways an organiser creates an accidental duplicate. So we also
 * measure token containment, and take the stronger reading. Both titles must
 * carry at least two meaningful words for containment to count, otherwise a
 * one-word title matches half the catalogue.
 */
export function titleSimilarity(a: string, b: string): number {
  const dice = similarity(a, b);
  const A = a.split(" ").filter(Boolean);
  const B = b.split(" ").filter(Boolean);
  if (A.length < 2 || B.length < 2) return dice;
  const setB = new Set(B);
  const shared = A.filter((w) => setB.has(w)).length;
  if (shared < 2) return dice;
  const containment = shared / Math.min(A.length, B.length);
  return Math.max(dice, containment);
}

export interface DupeCandidate<T> {
  item: T;
  score: number;
  reason: string;
}

export interface Identifiable {
  title: string;
  organization: string;
  url: string;
  deadline?: string | null | undefined;
}

/**
 * Exact fingerprint match, else the best fuzzy candidate above threshold.
 * Returns `exact` for "this IS the same record" and `probable` for "a human
 * should look".
 */
export function findDuplicate<T extends Identifiable>(
  candidate: Identifiable,
  existing: T[],
):
  { kind: "exact"; item: T } | { kind: "probable"; item: T; score: number; reason: string } | null {
  const fp = fingerprint(candidate);
  for (const item of existing) {
    if (fingerprint(item) === fp) return { kind: "exact", item };
  }

  const cTitle = normalizeTitle(candidate.title);
  const cOrg = normalizeOrg(candidate.organization);
  const cDomain = registrableDomain(candidate.url);

  let best: DupeCandidate<T> | null = null;
  for (const item of existing) {
    const sameDomain = registrableDomain(item.url) === cDomain;
    const orgSim = similarity(cOrg, normalizeOrg(item.organization));
    const titleSim = titleSimilarity(cTitle, normalizeTitle(item.title));

    // Require a shared domain OR a near-identical organisation. Without one of
    // those, two similarly named programs at different bodies are different.
    if (!sameDomain && orgSim < 0.85) continue;
    if (titleSim < 0.72) continue;

    const sameDeadline =
      candidate.deadline && item.deadline && candidate.deadline === item.deadline ? 0.06 : 0;
    const score = titleSim * 0.75 + orgSim * 0.19 + sameDeadline;
    if (!best || score > best.score) {
      best = {
        item,
        score,
        reason: `title ${(titleSim * 100) | 0}% similar${sameDomain ? ", same domain" : ""}${
          sameDeadline ? ", identical deadline" : ""
        }`,
      };
    }
  }
  return best
    ? { kind: "probable", item: best.item, score: best.score, reason: best.reason }
    : null;
}

/** Collapse duplicates found within a single crawl run, before comparing to the catalogue. */
export function dedupeBatch<T extends Identifiable>(
  items: T[],
): { kept: T[]; merged: { kept: T; dropped: T }[] } {
  const byFp = new Map<string, T>();
  const merged: { kept: T; dropped: T }[] = [];
  for (const item of items) {
    const fp = fingerprint(item);
    const prior = byFp.get(fp);
    if (!prior) byFp.set(fp, item);
    else merged.push({ kept: prior, dropped: item });
  }
  return { kept: [...byFp.values()], merged };
}
