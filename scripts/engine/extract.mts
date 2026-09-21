/**
 * AI structuring engine.
 *
 * Schema enforcement here is belt AND braces:
 *   1. The Anthropic tool `input_schema` constrains the shape at generation
 *      time (this is the "structured outputs" mechanism on this API).
 *   2. `validate()` re-checks everything in code afterwards, because a schema
 *      can guarantee that `app_deadline.value` is a string — it cannot
 *      guarantee the string is a real date, that the quote exists on the page,
 *      or that the model did not quietly invent the whole thing.
 *
 * Step 2 is the one that matters. Step 1 just saves us a round trip.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedProgram, Claim, Evidence } from "./types.mts";
import type { PageSnapshot } from "./fetch.mts";
import { EXTRACT_SYSTEM, TRIAGE_SYSTEM, extractUserMessage, repairMessage } from "./prompts.mts";

export const MODEL_EXTRACT = process.env["ENGINE_MODEL"] ?? "claude-sonnet-4-5";
export const MODEL_TRIAGE = process.env["ENGINE_TRIAGE_MODEL"] ?? "claude-haiku-4-5";

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set. See docs/DATA-PIPELINE.md.");
    client = new Anthropic({ apiKey });
  }
  return client;
}

/* ------------------------------------------------------------------ schema */

const claimSchema = (what: string) => ({
  type: ["object", "null"],
  description: `${what} Null when the page does not state it. Never guess, never carry over from a previous year.`,
  properties: {
    value: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "Strict YYYY-MM-DD." },
    evidence: {
      type: "string",
      enum: ["structured", "labelled", "prose", "inferred"],
      description: "How you know. Use 'inferred' never — return null instead.",
    },
    quote: {
      type: "string",
      minLength: 8,
      description: "Verbatim text from the page containing this date. Checked automatically.",
    },
  },
  required: ["value", "evidence", "quote"],
  additionalProperties: false,
});

export const EXTRACT_TOOL = {
  name: "record_program",
  description:
    "Record the structured details of one high school opportunity, read off the page text.",
  input_schema: {
    type: "object" as const,
    properties: {
      title: { type: "string", minLength: 2 },
      organization: { type: "string", minLength: 2 },
      category: { type: "string" },
      grade_levels: {
        type: "array",
        items: { type: "integer", minimum: 9, maximum: 12 },
        description:
          "Empty array when the page sets no grade restriction. Do not fill in 9-12 by default.",
      },
      app_open_date: claimSchema("The date applications OPEN."),
      app_deadline: claimSchema("The application DEADLINE."),
      program_start_date: claimSchema("The first day the program RUNS."),
      program_end_date: claimSchema("The last day the program runs."),
      cost_type: { type: "string", enum: ["Free", "Paid", "Need-Based Aid", "Stipend", "Unknown"] },
      cost_note: { type: ["string", "null"] },
      location_type: { type: "string", enum: ["In-Person", "Remote", "Hybrid", "Unknown"] },
      location_note: { type: ["string", "null"] },
      essay_prompts: { type: "array", items: { type: "string" } },
      required_documents: { type: "array", items: { type: "string" } },
      application_link: { type: ["string", "null"] },
      summary: { type: "string", minLength: 10, maxLength: 400 },
      eligibility: { type: ["string", "null"] },
      rolling: { type: "boolean" },
      not_a_program: { type: "boolean" },
      notes: { type: "array", items: { type: "string" } },
    },
    required: [
      "title",
      "organization",
      "category",
      "grade_levels",
      "app_open_date",
      "app_deadline",
      "program_start_date",
      "program_end_date",
      "cost_type",
      "cost_note",
      "location_type",
      "location_note",
      "essay_prompts",
      "required_documents",
      "application_link",
      "summary",
      "eligibility",
      "rolling",
      "not_a_program",
      "notes",
    ],
    additionalProperties: false,
  },
};

const TRIAGE_TOOL = {
  name: "triage",
  description: "Classify what this page is.",
  input_schema: {
    type: "object" as const,
    properties: {
      kind: { type: "string", enum: ["program", "listing", "other"] },
      reason: { type: "string", maxLength: 200 },
    },
    required: ["kind", "reason"],
    additionalProperties: false,
  },
};

/* -------------------------------------------------------------- validation */

/** Whitespace-insensitive substring test — the page text we hold has already
 *  been collapsed, and a model copying from it will reproduce single spaces
 *  where the page had a newline. That is a formatting difference, not a lie. */
function containsQuote(haystack: string, needle: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[‐-―]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  return norm(haystack).includes(norm(needle));
}

function validDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) return false;
  if (d.toISOString().slice(0, 10) !== s) return false; // rejects 2027-02-31
  const year = Number(s.slice(0, 4));
  const now = new Date().getUTCFullYear();
  return year >= now - 3 && year <= now + 4;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  /** Fields the validator itself nulled out, for the reviewer's notes. */
  dropped: string[];
}

const DATE_FIELDS = [
  "app_open_date",
  "app_deadline",
  "program_start_date",
  "program_end_date",
] as const;

export function validate(
  p: ExtractedProgram,
  page: { text: string; url: string },
): ValidationResult {
  const errors: string[] = [];
  const dropped: string[] = [];

  for (const f of DATE_FIELDS) {
    const claim = p[f];
    if (claim == null) continue;
    if (!validDate(claim.value)) {
      errors.push(`${f}: "${claim.value}" is not a plausible YYYY-MM-DD date`);
      continue;
    }
    if (claim.evidence === "inferred") {
      // Not an error worth a retry — just enforce the rule ourselves.
      (p as unknown as Record<string, unknown>)[f] = null;
      dropped.push(`${f} (model marked it inferred)`);
      continue;
    }
    if (!containsQuote(page.text, claim.quote)) {
      errors.push(`${f}: quote not found on the page — "${claim.quote.slice(0, 70)}"`);
      continue;
    }
    // The quote must actually mention the date it is evidence for, in some
    // form. Catches a real-quote-wrong-date pairing.
    const [y, m, d] = claim.value.split("-") as [string, string, string];
    const day = String(Number(d));
    const mon = new Date(claim.value + "T12:00:00Z").toLocaleString("en-CA", {
      month: "long",
      timeZone: "UTC",
    });
    const q = claim.quote.toLowerCase();
    const mentionsDay = new RegExp(`\\b${day}(st|nd|rd|th)?\\b`).test(q);
    const mentionsMonth =
      q.includes(mon.toLowerCase().slice(0, 3)) || q.includes(`-${m}-`) || q.includes(`/${m}/`);
    const mentionsIso = q.includes(claim.value) || q.includes(`${y}-${m}-${d}`);
    if (!mentionsIso && !(mentionsDay && mentionsMonth)) {
      errors.push(
        `${f}: quote does not appear to contain the date ${claim.value} — "${claim.quote.slice(0, 70)}"`,
      );
    }
  }

  // Ordering. A page that contradicts itself is a review item, not a crash.
  const iso = (c: Claim<string> | null) => (c && validDate(c.value) ? c.value : null);
  const open = iso(p.app_open_date),
    dl = iso(p.app_deadline);
  const start = iso(p.program_start_date),
    end = iso(p.program_end_date);
  if (open && dl && open > dl)
    p.notes.push(`Page states an open date (${open}) after the deadline (${dl}).`);
  if (start && end && start > end)
    p.notes.push(`Page states a start date (${start}) after the end date (${end}).`);
  if (dl && start && dl > start)
    p.notes.push(`Deadline (${dl}) falls after the program start (${start}).`);

  if (p.rolling && p.app_deadline) {
    p.notes.push("Marked rolling but a deadline was also extracted — check which the page means.");
  }
  if (p.grade_levels.length === 4) {
    p.notes.push(
      "All four grades listed — confirm the page really says 9-12 rather than being silent.",
    );
  }
  if (p.application_link) {
    try {
      p.application_link = new URL(p.application_link, page.url).toString();
    } catch {
      dropped.push("application_link (not a URL)");
      p.application_link = null;
    }
  }

  return { ok: errors.length === 0, errors, dropped };
}

/* ------------------------------------------------------------------- calls */

function toolResult<T>(msg: Anthropic.Message, name: string): T | null {
  for (const block of msg.content) {
    if (block.type === "tool_use" && block.name === name) return block.input as T;
  }
  return null;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  calls: number;
}
export const usage: Usage = { inputTokens: 0, outputTokens: 0, calls: 0 };
function track(m: Anthropic.Message) {
  usage.inputTokens += m.usage.input_tokens;
  usage.outputTokens += m.usage.output_tokens;
  usage.calls += 1;
}

/** Cheap gate. Runs on Haiku so the expensive model only sees real listings. */
export async function triage(
  page: PageSnapshot,
): Promise<{ kind: "program" | "listing" | "other"; reason: string }> {
  const msg = await anthropic().messages.create({
    model: MODEL_TRIAGE,
    max_tokens: 300,
    system: TRIAGE_SYSTEM,
    tools: [TRIAGE_TOOL],
    tool_choice: { type: "tool", name: "triage" },
    messages: [{ role: "user", content: `URL: ${page.url}\n\n${page.text.slice(0, 12_000)}` }],
  });
  track(msg);
  return toolResult(msg, "triage") ?? { kind: "other", reason: "no tool call returned" };
}

export interface ExtractResult {
  program: ExtractedProgram | null;
  errors: string[];
  dropped: string[];
  repaired: boolean;
}

/** Full extraction, with one repair round when validation fails. */
export async function extract(
  page: PageSnapshot,
  today = new Date().toISOString().slice(0, 10),
): Promise<ExtractResult> {
  const user = extractUserMessage({
    url: page.url,
    title: page.title,
    text: page.text,
    jsonLd: page.jsonLd,
    timeElements: page.timeElements,
    today,
  });

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: user }];
  let repaired = false;

  for (let attempt = 0; attempt < 2; attempt++) {
    const msg = await anthropic().messages.create({
      model: MODEL_EXTRACT,
      max_tokens: 3000,
      system: EXTRACT_SYSTEM,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: "record_program" },
      messages,
    });
    track(msg);

    const raw = toolResult<ExtractedProgram>(msg, "record_program");
    if (!raw)
      return { program: null, errors: ["model returned no tool call"], dropped: [], repaired };

    const result = validate(raw, page);
    if (result.ok) return { program: raw, errors: [], dropped: result.dropped, repaired };

    if (attempt === 0) {
      repaired = true;
      messages.push(
        { role: "assistant", content: msg.content },
        {
          role: "user",
          content: [
            {
              type: "tool_result" as const,
              tool_use_id: msg.content.find((b) => b.type === "tool_use")!.id,
              content: repairMessage(result.errors),
              is_error: true,
            },
          ],
        },
      );
      continue;
    }

    // Second failure: keep what validated, null what did not, flag for review.
    for (const f of DATE_FIELDS) {
      if (result.errors.some((e) => e.startsWith(f))) {
        (raw as unknown as Record<string, unknown>)[f] = null;
        result.dropped.push(`${f} (failed validation twice)`);
      }
    }
    raw.notes.push("Some dates could not be verified against the page and were dropped.");
    return { program: raw, errors: result.errors, dropped: result.dropped, repaired };
  }

  return { program: null, errors: ["unreachable"], dropped: [], repaired };
}

/** Rough cost, for the run summary. Update if you change models. */
export function estimateCostUsd(u: Usage = usage): number {
  // Sonnet 4.5 list pricing, USD per million tokens. Triage on Haiku is a
  // rounding error at this volume, so this over-estimates slightly on purpose.
  return (u.inputTokens / 1e6) * 3 + (u.outputTokens / 1e6) * 15;
}
