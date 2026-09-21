/**
 * ============================================================================
 *  ONBOARDING QUIZ — guided by Byte
 * ============================================================================
 *
 * Four questions and a result, with the mascot reacting to each answer.
 *
 * Two rules shaped every decision in here:
 *
 *  1. SKIPPING IS ALWAYS ONE TAP AWAY. There is a "Skip & explore" control on
 *     every single step, in the same place, never hidden and never styled as
 *     the scary option. A student who does not want to answer questions is not
 *     a failed conversion — they want the catalogue, and the catalogue works
 *     perfectly well without a profile.
 *
 *  2. NOTHING IS REQUIRED. Every step advances empty. Partial answers still
 *     produce a usable roadmap, just a broader one.
 *
 * Byte's lines all live in `src/lib/dialogue.ts` so the character's voice can
 * be rewritten without touching this file.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react";

import { SITE } from "@/config/site";
import {
  BUDGET_OPTIONS,
  COMMITMENT_OPTIONS,
  INTERESTS,
  SKILLS,
  programMatchesTrack,
  type BudgetPreference,
  type CommitmentPreference,
} from "@/data/taxonomy";
import {
  reactToFit,
  reactToGrade,
  reactToInterests,
  reactToSkills,
  resultLine,
  STEP_PROMPTS,
  type Line,
} from "@/lib/dialogue";
import { EMPTY_PROFILE, rankPrograms, type StudentProfile } from "@/lib/match";
import { normalizeAll } from "@/lib/program-schema";
import { graduationYearFor } from "@/lib/roadmap";
import { cn } from "@/lib/utils";
import { useNow } from "@/state/now";
import { useOnboarding } from "@/state/onboarding";
import { Byte } from "@/components/mascot/Byte";
import { SpeechBubble } from "@/components/mascot/SpeechBubble";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const STEPS = ["grade", "interests", "skills", "fit", "result"] as const;
type StepId = (typeof STEPS)[number];

const HEADINGS: Record<StepId, string> = {
  grade: "Where are you right now?",
  interests: "What pulls you in?",
  skills: "What do you want to get better at?",
  fit: "What actually fits your life?",
  result: "Your launchpad is ready",
};

/* -------------------------------------------------------------------------- */
/*  Option tile                                                                */
/* -------------------------------------------------------------------------- */

function Tile({
  selected,
  onClick,
  glyph,
  label,
  blurb,
  count,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  glyph?: string;
  label: string;
  blurb?: string;
  count?: number;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      whileHover={disabled ? {} : { y: -2 }}
      whileTap={disabled ? {} : { y: 2, transition: { duration: 0.06 } }}
      transition={{ type: "spring", stiffness: 520, damping: 26 }}
      className={cn(
        "sticker tap flex w-full items-start gap-3 rounded-xl bg-card px-3.5 py-3 text-left",
        "hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-card",
        selected && "bg-primary text-primary-foreground hover:bg-primary",
      )}
    >
      {glyph && (
        <span
          aria-hidden
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-md border-2 border-border font-display text-sm font-bold",
            selected ? "bg-accent text-accent-foreground" : "bg-secondary",
          )}
        >
          {glyph}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm leading-snug font-bold">{label}</span>
          {typeof count === "number" && (
            <span
              className={cn(
                "tabular ml-auto shrink-0 rounded-full border-2 border-border px-1.5 text-[0.65rem] font-bold",
                selected
                  ? "bg-primary-foreground text-primary"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {count}
            </span>
          )}
        </span>
        {blurb && (
          <span
            className={cn(
              "mt-0.5 block text-xs",
              selected ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            {blurb}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-[5px] border-2",
          selected
            ? "border-primary-foreground bg-primary-foreground"
            : "border-muted-foreground/40",
        )}
      >
        {selected && <Check className="size-3.5 text-primary" strokeWidth={4} />}
      </span>
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Quiz                                                                       */
/* -------------------------------------------------------------------------- */

export function OnboardingQuiz() {
  const { quizOpen, closeQuiz, skipQuiz, completeQuiz, profile } = useOnboarding();
  const now = useNow();

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [draft, setDraft] = useState<StudentProfile>(EMPTY_PROFILE);
  /** Byte's current line — a step prompt, or a reaction to what was just picked. */
  const [line, setLine] = useState<Line>(STEP_PROMPTS["grade"] as Line);

  const step = STEPS[index] ?? "grade";
  const isLast = step === "result";

  // Seed from saved answers each time the quiz opens, so "retake" starts from
  // what the student said last time rather than making them redo everything.
  useEffect(() => {
    if (!quizOpen) return;
    setDraft(profile);
    setIndex(0);
    setDirection(1);
    setLine(STEP_PROMPTS["grade"] as Line);
  }, [quizOpen, profile]);

  const all = useMemo(() => normalizeAll(now), [now]);

  /** How many listings sit behind each track — shown on the tile. */
  const trackCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const t of INTERESTS) {
      out[t.id] = all.filter((p) => programMatchesTrack(t, p.category, p.haystack)).length;
    }
    return out;
  }, [all]);

  const skillCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of SKILLS) out[s.id] = all.filter((p) => p.skills.includes(s.id)).length;
    return out;
  }, [all]);

  const matches = useMemo(() => (isLast ? rankPrograms(all, draft) : []), [isLast, all, draft]);

  useEffect(() => {
    if (!isLast) return;
    const soon = matches.filter((m) => m.program.urgency === "closing-soon").length;
    setLine(resultLine(matches.length, soon));
  }, [isLast, matches]);

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(STEPS.length - 1, next));
    setDirection(clamped > index ? 1 : -1);
    setIndex(clamped);
    const id = STEPS[clamped];
    if (id && id !== "result") setLine(STEP_PROMPTS[id] as Line);
  };

  const patch = (p: Partial<StudentProfile>, react?: Line | null) => {
    setDraft((d) => ({ ...d, ...p }));
    if (react) setLine(react);
  };

  const toggle = (key: "interests" | "skills", id: string) => {
    setDraft((d) => {
      const list = d[key];
      const nextList = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      const next = { ...d, [key]: nextList };
      const react = key === "interests" ? reactToInterests(nextList) : reactToSkills(nextList);
      if (react) setLine(react);
      return next;
    });
  };

  return (
    <Dialog open={quizOpen} onOpenChange={(o) => !o && closeQuiz()}>
      <DialogContent
        showCloseButton={false}
        className="sticker max-h-[92dvh] gap-0 overflow-hidden rounded-2xl border-2 p-0 sm:max-w-2xl"
      >
        <div className="flex max-h-[92dvh] flex-col">
          {/* ---------------- Byte + progress ---------------- */}
          <div className="relative border-b-2 border-border bg-surface px-4 py-4 sm:px-5">
            <div className="flex items-start gap-3">
              <Byte mood={line.mood} size="md" />
              <div className="min-w-0 flex-1 pt-1">
                <SpeechBubble key={line.text} text={line.text} />
              </div>
              <button
                type="button"
                onClick={skipQuiz}
                className="tap sticker shrink-0 rounded-full bg-card px-3 text-xs font-bold hover:bg-secondary active:sticker-press"
              >
                <X className="mr-1 inline size-3.5" aria-hidden />
                <span className="hidden sm:inline">Skip</span>
              </button>
            </div>

            <DialogTitle className="mt-4 font-display text-lg leading-tight sm:text-xl">
              {HEADINGS[step]}
            </DialogTitle>

            {/* pixel progress segments */}
            <ol className="mt-3 flex gap-1.5" aria-label="Progress">
              {STEPS.map((s, i) => (
                <li
                  key={s}
                  aria-current={i === index ? "step" : undefined}
                  className={cn(
                    "h-2 flex-1 rounded-[3px] border-2 border-border transition-colors",
                    i < index ? "bg-confirmed" : i === index ? "bg-accent" : "bg-card",
                  )}
                >
                  <span className="sr-only">{HEADINGS[s]}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* ---------------- step body ---------------- */}
          <div className="overflow-y-auto px-4 py-5 sm:px-5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: direction * 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -28 }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              >
                {step === "grade" && (
                  <fieldset>
                    <legend className="mb-3 text-sm text-muted-foreground">
                      This decides which programs will even accept you — the single most useful
                      thing you can tell {"Byte"}.
                    </legend>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {SITE.grades.map((g) => (
                        <Tile
                          key={g}
                          label={`Grade ${g}`}
                          selected={draft.grade === g}
                          onClick={() => {
                            const clearing = draft.grade === g;
                            const year = clearing ? null : graduationYearFor(g, now);
                            patch(
                              { grade: clearing ? null : g, gradYear: year },
                              clearing ? null : reactToGrade(g, year),
                            );
                          }}
                        />
                      ))}
                    </div>

                    {draft.grade !== null && draft.gradYear !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="sticker mt-4 rounded-xl bg-accent/15 p-4"
                      >
                        <p className="text-sm font-medium">
                          Graduating <strong className="tabular">{draft.gradYear}</strong>. Not
                          right?
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {[-1, 0, 1].map((offset) => {
                            const year = graduationYearFor(draft.grade as number, now) + offset;
                            return (
                              <button
                                key={year}
                                type="button"
                                onClick={() => patch({ gradYear: year })}
                                aria-pressed={draft.gradYear === year}
                                className={cn(
                                  "sticker tabular tap rounded-full px-4 text-sm font-bold active:sticker-press",
                                  draft.gradYear === year
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-card hover:bg-secondary",
                                )}
                              >
                                {year}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </fieldset>
                )}

                {step === "interests" && (
                  <fieldset>
                    <legend className="mb-3 text-sm text-muted-foreground">
                      Pick as many as you like, or none. The number on each tile is how many real
                      listings sit behind it.
                    </legend>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {INTERESTS.map((t) => (
                        <Tile
                          key={t.id}
                          glyph={t.glyph}
                          label={t.label}
                          blurb={
                            trackCounts[t.id] === 0
                              ? "Nothing in the catalogue yet"
                              : trackCounts[t.id] === 1
                                ? "Only one listing so far — a known gap"
                                : t.blurb
                          }
                          count={trackCounts[t.id] ?? 0}
                          selected={draft.interests.includes(t.id)}
                          disabled={trackCounts[t.id] === 0 && !draft.interests.includes(t.id)}
                          onClick={() => toggle("interests", t.id)}
                        />
                      ))}
                    </div>
                  </fieldset>
                )}

                {step === "skills" && (
                  <fieldset>
                    <legend className="mb-3 text-sm text-muted-foreground">
                      A program only gets tagged with a skill when its own description backs it up —
                      so these will not send you somewhere that merely sounds right.
                    </legend>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {SKILLS.map((s) => (
                        <Tile
                          key={s.id}
                          glyph={s.glyph}
                          label={s.label}
                          blurb={s.blurb}
                          count={skillCounts[s.id] ?? 0}
                          selected={draft.skills.includes(s.id)}
                          onClick={() => toggle("skills", s.id)}
                        />
                      ))}
                    </div>
                  </fieldset>
                )}

                {step === "fit" && (
                  <div className="space-y-6">
                    <fieldset>
                      <legend className="mb-1 text-sm font-bold">
                        How much time can you actually give?
                      </legend>
                      <p className="mb-3 text-sm text-muted-foreground">
                        Be honest. A half-finished summer residency helps nobody.
                      </p>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {COMMITMENT_OPTIONS.map((c) => (
                          <Tile
                            key={c.id}
                            glyph={c.glyph}
                            label={c.label}
                            blurb={c.blurb}
                            selected={draft.commitment === c.id}
                            onClick={() => {
                              const next = { ...draft, commitment: c.id as CommitmentPreference };
                              patch({ commitment: c.id as CommitmentPreference }, reactToFit(next));
                            }}
                          />
                        ))}
                      </div>
                    </fieldset>

                    <fieldset>
                      <legend className="mb-1 text-sm font-bold">What about cost?</legend>
                      <p className="mb-3 text-sm text-muted-foreground">
                        Plenty of the best programs here are free, and some of them pay you.
                      </p>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {BUDGET_OPTIONS.map((b) => (
                          <Tile
                            key={b.id}
                            glyph={b.glyph}
                            label={b.label}
                            blurb={b.blurb}
                            selected={draft.budget === b.id}
                            onClick={() => {
                              const next = { ...draft, budget: b.id as BudgetPreference };
                              patch({ budget: b.id as BudgetPreference }, reactToFit(next));
                            }}
                          />
                        ))}
                      </div>
                    </fieldset>
                  </div>
                )}

                {step === "result" && (
                  <div className="space-y-4">
                    <div className="sticker rounded-xl bg-surface p-5">
                      <p className="tabular font-display text-4xl leading-none font-bold text-primary">
                        {matches.length}
                      </p>
                      <p className="mt-1.5 text-sm text-foreground/80">
                        open opportunities match what you told Byte
                        {draft.grade !== null ? ` as a Grade ${draft.grade} student` : ""}.
                      </p>
                    </div>

                    <ul className="space-y-2.5">
                      {matches.slice(0, 3).map(({ program, reasons }, i) => (
                        <motion.li
                          key={program.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: 0.08 * i,
                            type: "spring",
                            stiffness: 380,
                            damping: 28,
                          }}
                          className="sticker rounded-xl bg-card p-4"
                        >
                          <p className="text-sm font-bold">{program.title}</p>
                          <p className="text-xs text-muted-foreground">{program.org}</p>
                          {reasons.length > 0 && (
                            <p className="mt-2 text-xs text-foreground/75">
                              {reasons.slice(0, 3).join(" · ")}
                            </p>
                          )}
                        </motion.li>
                      ))}
                      {matches.length === 0 && (
                        <li className="rounded-xl border-2 border-dashed border-rule p-4 text-sm text-muted-foreground">
                          Loosen the cost or grade answer and Byte will try again — or skip straight
                          to the full catalogue, which is always open.
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ---------------- footer ---------------- */}
          <div className="flex flex-wrap items-center gap-2 border-t-2 border-border bg-card px-4 py-3 sm:px-5">
            {index > 0 ? (
              <button
                type="button"
                onClick={() => go(index - 1)}
                className="tap inline-flex items-center gap-1.5 rounded-full px-3 text-sm font-bold text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={skipQuiz}
                className="tap rounded-full px-3 text-sm font-bold text-muted-foreground hover:text-foreground"
              >
                Skip &amp; explore directly
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              {!isLast && (
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  className="tap rounded-full px-3 text-sm font-bold text-muted-foreground hover:text-foreground"
                >
                  {index === 0 && draft.grade === null ? "Not sure" : "Skip this one"}
                </button>
              )}
              {isLast ? (
                <motion.div whileTap={{ y: 2 }}>
                  <Link
                    to="/roadmap"
                    onClick={() => completeQuiz(draft)}
                    className="sticker tap inline-flex items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground active:sticker-press"
                  >
                    <Sparkles className="size-4" aria-hidden />
                    See my roadmap
                  </Link>
                </motion.div>
              ) : (
                <motion.button
                  type="button"
                  whileTap={{ y: 2 }}
                  onClick={() => go(index + 1)}
                  className="sticker tap inline-flex items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground active:sticker-press"
                >
                  Continue
                  <ArrowRight className="size-4" aria-hidden />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
