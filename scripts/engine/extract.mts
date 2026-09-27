/**
 * AI structuring engine.
 *
 * Schema enforcement here is belt AND braces:
 *   1. The tool `parameters` (JSON Schema) constrains the shape at generation
 *      time (this is the "structured outputs" mechanism on this API).
 *   2. `validate()` re-checks everything in code afterwards, because a schema
 *      can guarantee that `app_deadline.value` is a string — it cannot
 *      guarantee the string is a real date, that the quote exists on the page,
 *      or that the model did not quietly invent the whole thing.
 *
 * Step 2 is the one that matters. Step 1 just saves us a round trip.
 *
 * PROVIDER: Groq (https://console.groq.com), chosen specifically because it
 * has a genuinely free tier with no credit card required. This is the one
 * paid-service decision in the whole engine, so it gets its own note:
 *
 *   - Free tier limits as of the numbers documented in docs/DATA-PIPELINE.md
 *     (they change — check https://console.groq.com/docs/rate-limits before
 *     assuming these still hold). The binding constraint in practice is
 *     tokens-per-day, not requests-per-day, which is why page text is
 *     truncated harder here than the old Anthropic version (see
 *     `extractUserMessage`'s `maxChars` default in prompts.mts) and why every
 *     call goes through `withRateLimit`, which paces requests and backs off
 *     on 429 instead of hammering the API.
 *   - If Groq ever changes its free tier in a way that breaks this, the
 *     failure mode is graceful: calls fail, the run marks affected programs
 *     "Needs verification" and moves on (see run.mts) — it does not crash the
 *     whole crawl and it never invents a date to compensate.
 */
import Groq from "groq-sdk";
import type { ExtractedProgram, Claim, Evidence } from "./types.mts";
import type { PageSnapshot } from "./fetch.mts";
import { EXTRACT_SYSTEM, TRIAGE_SYSTEM, extractUserMessage, repairMessage } from "./prompts.mts";

// Both are Groq free-tier models that support tool calling + JSON mode,
// CONFIRMED LIVE against a real Groq account on 2026-09-27 (an earlier choice
// of llama-3.3-70b-versatile / llama-3.1-8b-instant looked right from Groq's
// docs but 404'd for real -- those are Enterprise-tier only, not free tier;
// this pair is the one actually listed in Groq's free-tier rate-limit table).
// Override with ENGINE_MODEL / ENGINE_TRIAGE_MODEL if Groq changes this again
// -- check https://console.groq.com/docs/rate-limits, and don't trust the
// general models list page over the actual rate-limits table.
export const MODEL_EXTRACT = process.env["ENGINE_MODEL"] ?? "openai/gpt-oss-120b";
export const MODEL_TRIAGE = process.env["ENGINE_TRIAGE_MODEL"] ?? "openai/gpt-oss-20b";

let client: Groq | null = null;
function groq(): Groq {
  if (!client) {
    const apiKey = process.env["GROQ_API_KEY"];
    if (!apiKey) throw new Error("GROQ_API_KEY is not set. See docs/DATA-PIPELINE.md.");
    client = new Groq({ apiKey });
  }
  return client;
}

/* ---------------------------------------------------------- rate limiting */

/** Minimum gap between Groq calls, so a normal run never even approaches the
 *  free tier's per-minute caps. Override with ENGINE_GROQ_MIN_DELAY_MS if
 *  Groq's limits change; see docs/DATA-PIPELINE.md for the numbers this was
 *  set against. */
const MIN_DELAY_MS = Number(process.env["ENGINE_GROQ_MIN_DELAY_MS"] ?? 2500);
let lastCallAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Runs one Groq call with: (a) a minimum gap since the previous call, and
 *  (b) retry-with-backoff on 429, honouring Retry-After when the API sends
 *  one. Gives up after a small, bounded number of attempts — this engine
 *  never retries indefinitely (see run.mts's loop-prevention rules). A
 *  program that still fails after this is marked for review, not retried
 *  forever. */
async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  const wait = MIN_DELAY_MS - (Date.now() - lastCallAt);
  if (wait > 0) await sleep(wait);

  const maxAttempts = 4;
  let attempt = 0;
  for (;;) {
    attempt++;
    try {
      const result = await fn();
      lastCallAt = Date.now();
      return result;
    } catch (err) {
      lastCallAt = Date.now();
      const status = (err as { status?: number })?.status;
      if (status === 429 && attempt < maxAttempts) {
        const headers = (err as { headers?: Headers })?.headers;
        const retryAfter = headers?.get?.("retry-after");
        const backoffMs = retryAfter ? Number(retryAfter) * 1000 : 2 ** attempt * 5000;
        console.warn(
          `  [rate limit] Groq 429 on attempt ${attempt}/${maxAttempts} — waiting ${Math.round(backoffMs / 1000)}s`,
        );
        await sleep(backoffMs);
        continue;
      }
      throw err;
    }
  }
}

/* -------------------------------------------------------------- schema */

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

/** Groq's chat-completions API is OpenAI-shaped: tools are
 *  `{type:"function", function:{name, description, parameters}}`, not
 *  Anthropic's `{name, description, input_schema}`. Converting at the call
 *  site (rather than rewriting the schemas above) keeps the schemas
 *  provider-agnostic, in case this ever needs to point at a different
 *  OpenAI-compatible free endpoint again. */
function asOpenAiTool(tool: { name: string; description: string; input_schema: object }) {
  return {
    type: "function" as const,
    function: { name: tool.name, description: tool.description, parameters: tool.input_schema },
  };
}

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

type ToolCallMessage = Groq.Chat.Completions.ChatCompletionMessage;

function toolResult<T>(msg: ToolCallMessage | undefined, name: string): T | null {
  const call = msg?.tool_calls?.find((c) => c.type === "function" && c.function.name === name);
  if (!call) return null;
  try {
    return JSON.parse(call.function.arguments) as T;
  } catch {
    return null;
  }
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  calls: number;
}
export const usage: Usage = { inputTokens: 0, outputTokens: 0, calls: 0 };
function track(m: Groq.Chat.Completions.ChatCompletion) {
  usage.inputTokens += m.usage?.prompt_tokens ?? 0;
  usage.outputTokens += m.usage?.completion_tokens ?? 0;
  usage.calls += 1;
}

/** Cheap gate. Runs on the small model so the expensive one only sees real
 *  listings. */
export async function triage(
  page: PageSnapshot,
): Promise<{ kind: "program" | "listing" | "other"; reason: string }> {
  const msg = await withRateLimit(() =>
    groq().chat.completions.create({
      model: MODEL_TRIAGE,
      max_tokens: 300,
      messages: [
        { role: "system", content: TRIAGE_SYSTEM },
        { role: "user", content: `URL: ${page.url}\n\n${page.text.slice(0, 12_000)}` },
      ],
      tools: [asOpenAiTool(TRIAGE_TOOL)],
      tool_choice: { type: "function", function: { name: "triage" } },
    }),
  );
  track(msg);
  return (
    toolResult(msg.choices[0]?.message, "triage") ?? { kind: "other", reason: "no tool call returned" }
  );
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

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: EXTRACT_SYSTEM },
    { role: "user", content: user },
  ];
  let repaired = false;

  for (let attempt = 0; attempt < 2; attempt++) {
    const msg = await withRateLimit(() =>
      groq().chat.completions.create({
        model: MODEL_EXTRACT,
        max_tokens: 3000,
        messages,
        tools: [asOpenAiTool(EXTRACT_TOOL)],
        tool_choice: { type: "function", function: { name: "record_program" } },
      }),
    );
    track(msg);

    const assistantMsg = msg.choices[0]?.message;
    const toolCall = assistantMsg?.tool_calls?.find(
      (c) => c.type === "function" && c.function.name === "record_program",
    );
    const raw = toolResult<ExtractedProgram>(assistantMsg, "record_program");
    if (!raw || !toolCall)
      return { program: null, errors: ["model returned no tool call"], dropped: [], repaired };

    const result = validate(raw, page);
    if (result.ok) return { program: raw, errors: [], dropped: result.dropped, repaired };

    if (attempt === 0) {
      repaired = true;
      messages.push(
        { role: "assistant", content: assistantMsg.content ?? null, tool_calls: assistantMsg.tool_calls },
        { role: "tool", tool_call_id: toolCall.id, content: repairMessage(result.errors) },
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

/** Groq's free tier costs $0 as long as you stay within its rate limits (see
 *  docs/DATA-PIPELINE.md). This returns 0 unconditionally; if this project
 *  ever moves to a paid Groq tier, update this to real per-token pricing. */
export function estimateCostUsd(_u: Usage = usage): number {
  return 0;
}
