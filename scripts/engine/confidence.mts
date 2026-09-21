/**
 * Confidence scoring and the auto-publish gate.
 *
 * Per the decision on this build: DATES NEVER AUTO-PUBLISH. Not at 99%. The
 * score below decides how prominently a proposal is queued and how it is
 * described to the reviewer — it does not decide whether a date reaches a
 * student without a human seeing it. Non-date fields do auto-apply at high
 * confidence, because the cost of a wrong cost note is a mild annoyance and
 * the cost of a wrong deadline is a missed application.
 *
 * The score is computed from signals the model cannot influence by sounding
 * sure of itself: where the evidence came from, whether the link resolves,
 * how much of the page we could read, how far the text moved since last time.
 */
import type { Confidence, ExtractedProgram, FieldChange, Evidence, Claim } from "./types.mts";

export interface ScoreInput {
  extracted: ExtractedProgram;
  /** HTTP status of the page itself. */
  status: number;
  /** Health of `application_link`, if it was probed. */
  linkOk: boolean | null;
  /** Characters of readable text. A 300-char page is a redirect stub. */
  textLength: number;
  /** Fraction of the page text that changed since the last crawl, 0..1. Null if new. */
  drift: number | null;
  /** Validation problems left over after the repair round. */
  validationErrors: number;
  /** True if Playwright had to render it — slightly less reliable extraction. */
  rendered: boolean;
}

const EVIDENCE_WEIGHT: Record<Evidence, number> = {
  structured: 1.0,
  labelled: 0.8,
  prose: 0.45,
  inferred: 0,
};

const DATE_FIELDS = [
  "app_open_date",
  "app_deadline",
  "program_start_date",
  "program_end_date",
] as const;

export function scoreProposal(input: ScoreInput): Confidence {
  const { extracted: p } = input;
  const signals: Record<string, number> = {};
  // Base sits at 42, not 50, so that a page which does everything right lands
  // in the mid-90s rather than pinning at 100. A score that saturates stops
  // being able to tell two good pages apart, which is the whole job here.
  let score = 42;

  // --- evidence quality on the dates we did get -----------------------------
  const claims = DATE_FIELDS.map((f) => p[f]).filter((c): c is Claim<string> => c != null);
  if (claims.length) {
    // Two things matter and they are not the same: how good the evidence is,
    // and how much of the timeline we actually got. Averaging alone would
    // *reward* a page where we found one perfect date and missed three, so
    // coverage is scored separately.
    const avg = claims.reduce((s, c) => s + EVIDENCE_WEIGHT[c.evidence], 0) / claims.length;
    const coverage = claims.length / DATE_FIELDS.length;
    const pts = Math.round(avg * 14 + coverage * 10);
    signals["dateEvidence"] = pts;
    score += pts;
  } else if (p.rolling) {
    signals["rolling"] = 6;
    score += 6;
  } else {
    // No dates at all is not a failure — it is the honest, common case — but
    // it is also not something to publish confidently as a live listing.
    signals["noDates"] = -12;
    score -= 12;
  }

  // --- completeness ---------------------------------------------------------
  const filled = [
    p.title.length > 3,
    p.organization.length > 2,
    p.category.length > 2,
    p.grade_levels.length > 0,
    p.cost_type !== "Unknown",
    p.location_type !== "Unknown",
    Boolean(p.application_link),
    p.summary.length > 30,
    Boolean(p.eligibility),
  ].filter(Boolean).length;
  const completeness = Math.round((filled / 9) * 18);
  signals["completeness"] = completeness;
  score += completeness;

  // --- link and page health -------------------------------------------------
  if (input.status === 200) {
    signals["pageOk"] = 5;
    score += 5;
  }
  if (input.linkOk === true) {
    signals["applyLinkOk"] = 8;
    score += 8;
  }
  if (input.linkOk === false) {
    signals["applyLinkDead"] = -25;
    score -= 25;
  }
  if (input.textLength < 800) {
    signals["thinPage"] = -15;
    score -= 15;
  }
  if (input.rendered) {
    signals["jsRendered"] = -3;
    score -= 3;
  }

  // --- change and correctness signals --------------------------------------
  if (input.drift != null && input.drift > 0.4) {
    signals["largeTextChange"] = -10;
    score -= 10;
  }
  if (input.validationErrors > 0) {
    const penalty = -12 * Math.min(input.validationErrors, 3);
    signals["validationErrors"] = penalty;
    score += penalty;
  }
  if (p.notes.length > 2) {
    signals["modelFlags"] = -6;
    score -= 6;
  }
  if (p.not_a_program) {
    signals["notAProgram"] = -40;
    score -= 40;
  }

  score = Math.max(0, Math.min(100, score));
  const band: Confidence["band"] = score >= 78 ? "high" : score >= 55 ? "medium" : "low";

  return { score, band, siteConfidence: siteConfidenceFor(p), signals };
}

/**
 * Map to the vocabulary `src/lib/program-schema.ts` already speaks.
 *
 *   confirmed — we read this off structured markup or an explicit label.
 *   estimated — we read it out of prose. Shown with a hedge in the UI.
 *   unposted  — the organiser has not published dates. Shown as "not published".
 *
 * Note it is driven by the DEADLINE's evidence specifically. That is the field
 * the whole site is organised around; a confirmed start date does not make an
 * estimated deadline any safer to present as fact.
 */
export function siteConfidenceFor(p: ExtractedProgram): Confidence["siteConfidence"] {
  const dl = p.app_deadline;
  if (!dl) return p.rolling ? "confirmed" : "unposted";
  if (dl.evidence === "structured" || dl.evidence === "labelled") return "confirmed";
  return "estimated";
}

/* --------------------------------------------------------------- the gate */

/** Fields a machine may change on its own, at high confidence. */
const AUTO_APPLICABLE = new Set([
  "summary",
  "category",
  "cost_type",
  "cost_note",
  "location_type",
  "location_note",
  "eligibility",
  "essay_prompts",
  "required_documents",
  "grade_levels",
  "application_link",
  "organization",
  "last_verified_at",
  "link_health",
]);

/** Fields no machine may ever change on its own. */
export const NEVER_AUTO = new Set([
  "app_open_date",
  "app_deadline",
  "program_start_date",
  "program_end_date",
  "title",
  "is_active",
  "confidence",
]);

export function isAutoApplicable(field: string, confidence: Confidence): boolean {
  if (NEVER_AUTO.has(field)) return false;
  if (!AUTO_APPLICABLE.has(field)) return false;
  return confidence.band === "high";
}

export type Decision = {
  disposition: "auto-apply" | "needs-review" | "unchanged" | "archive";
  reasons: string[];
};

export function decide(args: {
  changes: FieldChange[];
  confidence: Confidence;
  isNew: boolean;
  pageGone: boolean;
  probableDuplicate: boolean;
}): Decision {
  const reasons: string[] = [];

  if (args.pageGone) {
    return { disposition: "archive", reasons: ["Source page no longer resolves."] };
  }
  if (args.confidence.signals["notAProgram"]) {
    return {
      disposition: "needs-review",
      reasons: ["Extractor does not think this page is a single program."],
    };
  }
  if (args.probableDuplicate) {
    return {
      disposition: "needs-review",
      reasons: ["Looks like an existing listing under a different name."],
    };
  }
  if (args.isNew) {
    // Every brand-new listing is seen by a human once. After that, its
    // non-date fields can drift on their own.
    return {
      disposition: "needs-review",
      reasons: [`New listing (confidence ${args.confidence.score}/100, ${args.confidence.band}).`],
    };
  }
  if (!args.changes.length) {
    return { disposition: "unchanged", reasons: ["No field changed since the last crawl."] };
  }

  const blocked = args.changes.filter((c) => !c.autoApplicable);
  if (blocked.length) {
    const dateNames = new Set<string>([
      ...DATE_FIELDS,
      "deadline",
      "appOpenDate",
      "programStartDate",
      "programEndDate",
    ]);
    const dates = blocked.filter((c) => dateNames.has(c.field));
    if (dates.length) {
      reasons.push(
        `Date change detected — ${dates.map((d) => `${d.field}: ${String(d.before) || "none"} → ${String(d.after)}`).join("; ")}. Dates never auto-publish.`,
      );
    }
    const other = blocked.filter((c) => !dates.includes(c));
    if (other.length)
      reasons.push(`Changes needing review: ${other.map((c) => c.field).join(", ")}.`);
    if (args.confidence.band !== "high") reasons.push(`Confidence ${args.confidence.score}/100.`);
    return { disposition: "needs-review", reasons };
  }

  reasons.push(`Auto-applied: ${args.changes.map((c) => c.field).join(", ")}.`);
  return { disposition: "auto-apply", reasons };
}

/** Compare an extraction against the catalogue entry it matched. */
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  confidence: Confidence,
): FieldChange[] {
  const changes: FieldChange[] = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const field of keys) {
    if (field === "last_verified_at") continue; // always changes, never interesting
    const b = before[field];
    const a = after[field];
    if (a === undefined) continue; // extractor silent -> keep existing
    if (JSON.stringify(b ?? null) === JSON.stringify(a ?? null)) continue;
    // Never let the extractor blank a field we already have. Absence of
    // evidence this crawl is not evidence the organiser removed it.
    if ((a === null || a === "" || (Array.isArray(a) && !a.length)) && b != null && b !== "")
      continue;
    changes.push({
      field,
      before: b ?? null,
      after: a,
      evidence: "n/a",
      autoApplicable: isAutoApplicable(field, confidence),
    });
  }
  return changes;
}
