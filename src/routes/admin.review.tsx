/**
 * /admin/review — the human-in-the-loop queue.
 *
 * Every proposal the engine would not publish on its own lands here. The
 * design goal is that a counsellor with four minutes between periods can clear
 * the queue, so each item answers three questions above the fold: what changed,
 * what sentence on the source page says so, and is the link alive.
 *
 * Approve / Reject are one click. Edit is inline, and only on the fields that
 * matter. Keyboard: A approve, R reject, J/K move, E edit.
 *
 * Writing: in dev, Save writes data/review-decisions.json directly. On a
 * deployed build there is no writable filesystem, so Save downloads the same
 * file for you to commit. Either way `npm run engine:apply` is what turns a
 * decision into a change in programs.ts — nothing here edits the catalogue.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { SITE } from "@/config/site";

/* ------------------------------------------------------------------ types */

type Evidence = "structured" | "labelled" | "prose" | "inferred";
interface Claim {
  value: string;
  evidence: Evidence;
  quote: string;
}

/**
 * Field values as they survive the wire. This is narrower than the engine's own
 * `unknown` on purpose: a TanStack server function validates that everything it
 * returns is serializable, and `unknown` is not. Every value the engine actually
 * puts in a proposal fits here.
 */
type Jsonish = string | number | boolean | string[] | number[] | null;

interface FieldChange {
  field: string;
  before: Jsonish;
  after: Jsonish;
  autoApplicable: boolean;
}
interface Proposal {
  id: string;
  url: string;
  domain: string;
  fetchedAt: string;
  matchedProgramId?: string;
  disposition: "auto-apply" | "needs-review" | "unchanged" | "archive" | "skipped";
  reasons: string[];
  changes: FieldChange[];
  confidence: { score: number; band: "high" | "medium" | "low"; siteConfidence: string };
  extracted: {
    title: string;
    organization: string;
    category: string;
    grade_levels: number[];
    app_open_date: Claim | null;
    app_deadline: Claim | null;
    program_start_date: Claim | null;
    program_end_date: Claim | null;
    cost_type: string;
    cost_note: string | null;
    location_type: string;
    location_note: string | null;
    essay_prompts: string[];
    required_documents: string[];
    application_link: string | null;
    summary: string;
    eligibility: string | null;
    rolling: boolean;
    not_a_program: boolean;
    notes: string[];
  };
}
interface QueueFile {
  generatedAt: string;
  runId: string;
  items: Proposal[];
}

type Action = "approve" | "reject";
interface DecisionRecord {
  proposalId: string;
  action: Action;
  edits?: Record<string, Jsonish>;
  decidedAt: string;
}

/* ---------------------------------------------------------- server access */

const loadQueue = createServerFn({ method: "GET" }).handler(async (): Promise<QueueFile> => {
  try {
    const { readFile } = await import("node:fs/promises");
    return JSON.parse(await readFile("data/review-queue.json", "utf8")) as QueueFile;
  } catch {
    return { generatedAt: new Date().toISOString(), runId: "none", items: [] };
  }
});

const saveDecisions = createServerFn({ method: "POST" })
  .validator((d: DecisionRecord[]) => d)
  .handler(async ({ data }): Promise<{ written: boolean; reason?: string }> => {
    try {
      const { writeFile, mkdir } = await import("node:fs/promises");
      await mkdir("data", { recursive: true });
      await writeFile(
        "data/review-decisions.json",
        JSON.stringify({ decisions: data }, null, 2) + "\n",
      );
      return { written: true };
    } catch (err) {
      return { written: false, reason: (err as Error).message };
    }
  });

/* ----------------------------------------------------------------- route */

export const Route = createFileRoute("/admin/review")({
  component: ReviewQueue,
  loader: () => loadQueue(),
  head: () => ({
    meta: [
      { title: `Review queue · ${SITE.shortName}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

/* ----------------------------------------------------------------- bits */

const DATE_FIELDS = [
  "app_open_date",
  "app_deadline",
  "program_start_date",
  "program_end_date",
] as const;
const DATE_LABEL: Record<(typeof DATE_FIELDS)[number], string> = {
  app_open_date: "Applications open",
  app_deadline: "Deadline",
  program_start_date: "Program starts",
  program_end_date: "Program ends",
};

const EVIDENCE_COPY: Record<Evidence, { label: string; tone: string; explain: string }> = {
  structured: {
    label: "Structured",
    tone: "pine",
    explain: "Read from schema.org markup — the strongest evidence there is.",
  },
  labelled: {
    label: "Labelled",
    tone: "cobalt",
    explain: "The page names the field next to the date.",
  },
  prose: {
    label: "Prose",
    tone: "mustard",
    explain: "Read out of a sentence. Worth checking yourself.",
  },
  inferred: {
    label: "Inferred",
    tone: "tomato",
    explain: "The model worked it out. Never publishable.",
  },
};

function fmt(v: Jsonish): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

function EvidenceChip({ evidence }: { evidence: Evidence }) {
  const c = EVIDENCE_COPY[evidence];
  return (
    <span
      className="pixel-corner text-[0.7rem] font-bold uppercase tracking-wide px-2 py-0.5 border-2 border-ink"
      style={{ background: `var(--arcade-${c.tone})`, color: "var(--arcade-paper)" }}
      title={c.explain}
    >
      {c.label}
    </span>
  );
}

function ConfidenceMeter({ score, band }: { score: number; band: string }) {
  const tone = band === "high" ? "pine" : band === "medium" ? "mustard" : "tomato";
  return (
    <div className="flex items-center gap-2" title={`Confidence ${score}/100 (${band})`}>
      <div className="h-3 w-24 border-2 border-ink bg-white overflow-hidden">
        <div
          className="h-full"
          style={{ width: `${score}%`, background: `var(--arcade-${tone})` }}
        />
      </div>
      <span className="tnum text-sm font-bold">{score}</span>
    </div>
  );
}

/* --------------------------------------------------------------- the page */

function ReviewQueue() {
  const queue = Route.useLoaderData();
  const reduce = useReducedMotion();

  const items = useMemo(
    () =>
      queue.items.filter((i) => i.disposition === "needs-review" || i.disposition === "archive"),
    [queue.items],
  );

  const [decisions, setDecisions] = useState<Record<string, DecisionRecord>>({});
  const [edits, setEdits] = useState<Record<string, Record<string, Jsonish>>>({});
  const [cursor, setCursor] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "downloaded">("idle");
  const listRef = useRef<HTMLDivElement>(null);

  const pending = items.filter((i) => !decisions[i.id]);
  const done = Object.keys(decisions).length;

  const decide = useCallback(
    (item: Proposal, action: Action) => {
      setDecisions((d) => ({
        ...d,
        [item.id]: {
          proposalId: item.id,
          action,
          ...(edits[item.id] ? { edits: edits[item.id]! } : {}),
          decidedAt: new Date().toISOString(),
        },
      }));
      setSaveState("idle");
      setCursor((c) => Math.min(c + 1, items.length - 1));
    },
    [edits, items.length],
  );

  const undo = useCallback((id: string) => {
    setDecisions((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
    setSaveState("idle");
  }, []);

  // Keyboard. Skipped entirely while an input has focus, so typing an edit
  // does not approve the item under the cursor.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      const item = items[cursor];
      if (!item) return;
      if (e.key === "j" || e.key === "ArrowDown") {
        setCursor((c) => Math.min(c + 1, items.length - 1));
        e.preventDefault();
      } else if (e.key === "k" || e.key === "ArrowUp") {
        setCursor((c) => Math.max(c - 1, 0));
        e.preventDefault();
      } else if (e.key === "a") decide(item, "approve");
      else if (e.key === "r") decide(item, "reject");
      else if (e.key === "e") setEditing((x) => (x === item.id ? null : item.id));
      else if (e.key === "u") undo(item.id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cursor, items, decide, undo]);

  async function save() {
    const payload = Object.values(decisions);
    if (!payload.length) return;
    setSaveState("saving");
    const res = await saveDecisions({ data: payload }).catch(() => ({
      written: false,
      reason: "no server",
    }));
    if (res.written) {
      setSaveState("saved");
      return;
    }
    // Deployed build: no writable filesystem. Hand the file over instead.
    const blob = new Blob([JSON.stringify({ decisions: payload }, null, 2) + "\n"], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "review-decisions.json";
    a.click();
    URL.revokeObjectURL(a.href);
    setSaveState("downloaded");
  }

  if (!items.length) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-3xl">Review queue</h1>
        <p className="mt-4 text-lg">
          Nothing waiting. The last engine run was{" "}
          <strong>{new Date(queue.generatedAt).toLocaleString("en-CA")}</strong> ({queue.runId}).
        </p>
        <p className="mt-4 opacity-75">
          If you expected items here, the queue file is written by the weekly crawl — check the most
          recent <code>Data engine sync</code> pull request.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="sticker bg-white p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl">Review queue</h1>
            <p className="text-sm opacity-75">
              Run {queue.runId} · {items.length} item{items.length === 1 ? "" : "s"} · {done}{" "}
              decided · {pending.length} left
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70 hidden sm:inline">
              A approve · R reject · E edit · J/K move · U undo
            </span>
            <button
              type="button"
              onClick={save}
              disabled={!done || saveState === "saving"}
              className="sticker sticker-press tap bg-cobalt text-white px-4 min-h-11 font-bold disabled:opacity-40"
            >
              {saveState === "saving"
                ? "Saving…"
                : saveState === "saved"
                  ? "Saved ✓"
                  : saveState === "downloaded"
                    ? "Downloaded ✓"
                    : `Save ${done} decision${done === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
        {(saveState === "saved" || saveState === "downloaded") && (
          <p className="mt-3 text-sm border-t-2 border-ink pt-3">
            {saveState === "saved"
              ? "Written to data/review-decisions.json. "
              : "Downloaded — commit it to data/review-decisions.json. "}
            Then run <code>npm run engine:apply</code> (or the <em>apply</em> workflow) to write
            these into the catalogue.
          </p>
        )}
      </header>

      <p className="mb-6 text-sm border-2 border-ink bg-mustard/20 p-3">
        <strong>Dates are never published without you.</strong> The engine can update a cost note or
        a summary by itself; it cannot move a deadline. Everything below with a date change is here
        because a person has to confirm it.
      </p>

      <div ref={listRef} className="grid gap-4">
        {items.map((item, i) => {
          const decision = decisions[item.id];
          const isCursor = i === cursor;
          const dateChanges = item.changes.filter((c) =>
            (DATE_FIELDS as readonly string[]).includes(c.field),
          );
          const otherChanges = item.changes.filter(
            (c) => !(DATE_FIELDS as readonly string[]).includes(c.field),
          );
          const e = item.extracted;

          return (
            <motion.article
              key={item.id}
              layout={!reduce}
              onClick={() => setCursor(i)}
              className={`sticker bg-white p-4 ${isCursor ? "ring-4 ring-cobalt/40" : ""} ${decision ? "opacity-60" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl leading-tight">{e.title || item.url}</h2>
                  <p className="text-sm opacity-80">
                    {e.organization} · {e.category}
                    {e.grade_levels.length
                      ? ` · grades ${e.grade_levels.join(", ")}`
                      : " · grades not stated"}
                  </p>
                </div>
                <ConfidenceMeter score={item.confidence.score} band={item.confidence.band} />
              </div>

              {item.disposition === "archive" && (
                <p className="mt-3 border-2 border-ink bg-tomato/15 p-2 text-sm">
                  <strong>Proposed for archive.</strong> The source page no longer resolves.
                  Approving keeps the listing in history for the timeline but removes it from
                  search.
                </p>
              )}

              <ul className="mt-3 grid gap-1 text-sm">
                {item.reasons.map((r, n) => (
                  <li key={n}>· {r}</li>
                ))}
              </ul>

              {/* Dates, with the sentence that justifies each one. */}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {DATE_FIELDS.map((f) => {
                  const claim = e[f];
                  const change = dateChanges.find((c) => c.field === f);
                  const edited = edits[item.id]?.[f];
                  return (
                    <div key={f} className="border-2 border-ink p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="kicker text-xs">{DATE_LABEL[f]}</span>
                        {claim && <EvidenceChip evidence={claim.evidence} />}
                      </div>
                      {editing === item.id ? (
                        <input
                          type="date"
                          defaultValue={(edited as string) ?? claim?.value ?? ""}
                          onChange={(ev) =>
                            setEdits((x) => ({
                              ...x,
                              [item.id]: { ...(x[item.id] ?? {}), [f]: ev.target.value || null },
                            }))
                          }
                          className="mt-1 w-full border-2 border-ink px-2 py-1 min-h-11"
                        />
                      ) : (
                        <p className="tnum mt-1 font-bold">
                          {change ? (
                            <>
                              <s className="opacity-50">{fmt(change.before)}</s> →{" "}
                              {fmt(change.after)}
                            </>
                          ) : (
                            ((edited as string) ??
                            claim?.value ?? (
                              <span className="opacity-60 font-normal">
                                Not published by the organiser
                              </span>
                            ))
                          )}
                        </p>
                      )}
                      {claim?.quote && (
                        <blockquote className="mt-1 border-l-4 border-ink/30 pl-2 text-xs italic opacity-80">
                          “{claim.quote}”
                        </blockquote>
                      )}
                    </div>
                  );
                })}
              </div>

              {otherChanges.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-bold">
                    {otherChanges.length} other field change{otherChanges.length === 1 ? "" : "s"}
                  </summary>
                  <table className="mt-2 w-full text-sm">
                    <tbody>
                      {otherChanges.map((c) => (
                        <tr key={c.field} className="border-t-2 border-ink/20">
                          <td className="py-1 pr-2 font-bold align-top">{c.field}</td>
                          <td className="py-1 opacity-60 align-top">{fmt(c.before)}</td>
                          <td className="py-1 pl-2 align-top">→ {fmt(c.after)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              )}

              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-bold">Full extraction</summary>
                <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="kicker text-xs">Cost</dt>
                    <dd>{e.cost_note ?? e.cost_type}</dd>
                  </div>
                  <div>
                    <dt className="kicker text-xs">Format</dt>
                    <dd>
                      {e.location_type}
                      {e.location_note ? ` — ${e.location_note}` : ""}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="kicker text-xs">Summary</dt>
                    <dd>{e.summary}</dd>
                  </div>
                  {e.eligibility && (
                    <div className="sm:col-span-2">
                      <dt className="kicker text-xs">Eligibility</dt>
                      <dd>{e.eligibility}</dd>
                    </div>
                  )}
                  {e.essay_prompts.length > 0 && (
                    <div className="sm:col-span-2">
                      <dt className="kicker text-xs">Essay prompts</dt>
                      <dd>
                        <ul className="list-disc pl-5">
                          {e.essay_prompts.map((p, n) => (
                            <li key={n}>{p}</li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                  {e.required_documents.length > 0 && (
                    <div className="sm:col-span-2">
                      <dt className="kicker text-xs">Required documents</dt>
                      <dd>{e.required_documents.join(" · ")}</dd>
                    </div>
                  )}
                </dl>
                {e.notes.length > 0 && (
                  <div className="mt-2 border-2 border-ink bg-mustard/15 p-2 text-sm">
                    <strong>Extractor flagged:</strong>
                    <ul className="list-disc pl-5">
                      {e.notes.map((n, k) => (
                        <li key={k}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </details>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t-2 border-ink pt-3">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="sticker tap bg-white px-3 min-h-11 inline-flex items-center text-sm font-bold"
                >
                  Open source page ↗
                </a>
                {e.application_link && e.application_link !== item.url && (
                  <a
                    href={e.application_link}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="sticker tap bg-white px-3 min-h-11 inline-flex items-center text-sm font-bold"
                  >
                    Apply link ↗
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setEditing((x) => (x === item.id ? null : item.id))}
                  className="sticker sticker-press tap bg-white px-3 min-h-11 text-sm font-bold"
                >
                  {editing === item.id ? "Done editing" : "Edit dates"}
                </button>

                <div className="ml-auto flex items-center gap-2">
                  <AnimatePresence mode="wait" initial={false}>
                    {decision ? (
                      <motion.div
                        key="decided"
                        {...(reduce
                          ? {}
                          : {
                              initial: { scale: 0.9, opacity: 0 },
                              animate: { scale: 1, opacity: 1 },
                              exit: { opacity: 0 },
                            })}
                        className="flex items-center gap-2"
                      >
                        <span className="font-bold text-sm">
                          {decision.action === "approve" ? "Approved" : "Rejected"}
                        </span>
                        <button
                          type="button"
                          onClick={() => undo(item.id)}
                          className="sticker sticker-press tap bg-white px-3 min-h-11 text-sm font-bold"
                        >
                          Undo
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="choose"
                        {...(reduce
                          ? {}
                          : {
                              initial: { opacity: 0 },
                              animate: { opacity: 1 },
                              exit: { opacity: 0 },
                            })}
                        className="flex items-center gap-2"
                      >
                        <button
                          type="button"
                          onClick={() => decide(item, "reject")}
                          className="sticker sticker-press tap bg-white px-4 min-h-11 font-bold"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => decide(item, "approve")}
                          className="sticker sticker-press tap bg-pine text-white px-4 min-h-11 font-bold"
                        >
                          Approve
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </main>
  );
}
