/**
 * Shared types for the "Always-Updated" data engine.
 *
 * The engine's output is deliberately NOT a `Program` (the shape the site
 * renders). It is a *proposal*: a claim about a program, with the evidence
 * that backs each field. Only the sink decides what becomes a Program, and
 * the confidence gate decides what a human has to look at first.
 */

/** Where a value came from. This is the whole trust model in one type. */
export type Evidence =
  /** Structured markup on the page: JSON-LD, microdata, a <time datetime>. */
  | "structured"
  /** An explicitly labelled field: "Application deadline: March 1, 2027". */
  | "labelled"
  /** Read out of running prose. Always the weakest reading. */
  | "prose"
  /** The model inferred it from context. Never publishable as fact. */
  | "inferred";

/** A single extracted value plus how we know it. */
export interface Claim<T> {
  value: T;
  evidence: Evidence;
  /** Verbatim snippet from the page that supports the value. Must be a substring of the page text. */
  quote: string;
}

export type CostType = "Free" | "Paid" | "Need-Based Aid" | "Stipend" | "Unknown";
export type LocationType = "In-Person" | "Remote" | "Hybrid" | "Unknown";

/**
 * Exactly the field list the spec asks for. `Claim`-wrapped where a wrong
 * value would mislead a student (all four dates, cost, link); plain where it
 * would not (title, prose lists).
 */
export interface ExtractedProgram {
  title: string;
  organization: string;
  category: string;
  /** Integers in 9..12. Empty means the page did not say. */
  grade_levels: number[];

  app_open_date: Claim<string> | null;
  app_deadline: Claim<string> | null;
  program_start_date: Claim<string> | null;
  program_end_date: Claim<string> | null;

  cost_type: CostType;
  cost_note: string | null;
  location_type: LocationType;
  location_note: string | null;

  essay_prompts: string[];
  required_documents: string[];
  application_link: string | null;

  /** One or two sentences, in the organiser's own framing. No marketing voice. */
  summary: string;
  /** Eligibility prose as written, not normalised. */
  eligibility: string | null;
  /** True only if the page says applications are accepted on a rolling basis. */
  rolling: boolean;
  /** Model's own flag: the page is not actually a single program listing. */
  not_a_program: boolean;
  /** Anything the model could not resolve, in plain words, for the reviewer. */
  notes: string[];
}

/** Everything the engine knows about one candidate after a crawl pass. */
export interface Proposal {
  /** Stable id: sha1 of the fingerprint. */
  id: string;
  fingerprint: string;
  url: string;
  /** Registrable domain, e.g. "utoronto.ca". */
  domain: string;
  /** sha256 of the normalised page text. Drives "did anything change?". */
  contentHash: string;
  fetchedAt: string;
  extracted: ExtractedProgram;
  confidence: Confidence;
  /** Set when this proposal matched an existing catalogue entry. */
  matchedProgramId?: string;
  /** Field-level diff against the matched program. Empty for new listings. */
  changes: FieldChange[];
  /** What the engine decided to do with it. */
  disposition: Disposition;
  /** Human-readable reasons, shown in the PR body and the review queue. */
  reasons: string[];
}

export interface FieldChange {
  field: string;
  before: unknown;
  after: unknown;
  evidence: Evidence | "n/a";
  /** True when this change may be applied without a human. */
  autoApplicable: boolean;
}

export interface Confidence {
  /** 0..100. */
  score: number;
  band: "high" | "medium" | "low";
  /** The confidence the site's own schema understands. */
  siteConfidence: "confirmed" | "estimated" | "unposted";
  signals: Record<string, number>;
}

export type Disposition =
  /** Safe to write straight into programs.ts in the PR. */
  | "auto-apply"
  /** Written into the review queue; a human clicks Approve. */
  | "needs-review"
  /** Nothing changed since the last crawl. */
  | "unchanged"
  /** The page is gone or is not a program. */
  | "archive"
  /** Dropped before extraction (robots, duplicate, off-topic). */
  | "skipped";

/** A curated starting point for discovery. */
export interface SeedSource {
  id: string;
  label: string;
  url: string;
  /** Crawl links out of this page (one hop) rather than extracting from it. */
  kind: "hub" | "listing";
  /** Only follow links whose href matches. Keeps a hop from wandering. */
  followPattern?: RegExp;
  /** Hard ceiling on links followed from this hub in one run. */
  maxLinks?: number;
  region?: string;
  notes?: string;
}

export interface LinkHealth {
  url: string;
  ok: boolean;
  status: number | null;
  /** "dead" only after two consecutive failures on different days. */
  verdict: "ok" | "redirected" | "suspect" | "dead";
  redirectedTo?: string;
  checkedAt: string;
  error?: string;
}
