/**
 * ============================================================================
 *  PREPARATION WORKSPACE
 * ============================================================================
 *
 * The bit between "I found a program" and "I applied", which is where most
 * applications quietly die.
 *
 * Steps come from `PREP_STEPS` in config, filtered to the ones that actually
 * apply: there is no point asking for a transcript on a one-day contest, or
 * about financial aid on something free. Progress is per program and saved in
 * the student's own browser.
 */

import { AnimatePresence, motion } from "framer-motion";
import { Check, Send } from "lucide-react";

import { PREP_STEPS } from "@/config/site";
import type { NormalizedProgram } from "@/lib/program-schema";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/state/onboarding";

/** Which of the default steps are relevant to this program. */
export function stepsForProgram(program: NormalizedProgram) {
  return PREP_STEPS.filter((s) => {
    if (!s.appliesTo || s.appliesTo === "all") return true;
    if (s.appliesTo === "intensive") return program.commitment === "intensive";
    if (s.appliesTo === "paid") return program.costTier === "paid" || program.costTier === "aid";
    return true;
  });
}

export function PrepChecklist({ program }: { program: NormalizedProgram }) {
  const { stepsFor, toggleStep, isSubmitted, toggleSubmitted, hydrated } = useOnboarding();

  const steps = stepsForProgram(program);
  const done = hydrated ? stepsFor(program.id) : [];
  const completed = steps.filter((s) => done.includes(s.id)).length;
  const pct = steps.length === 0 ? 0 : Math.round((completed / steps.length) * 100);
  const submitted = hydrated && isSubmitted(program.id);

  return (
    <section aria-labelledby="prep-heading">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="prep-heading" className="font-display text-xl font-bold">
          Get it done
        </h2>
        <span className="tabular kicker">
          {completed} of {steps.length}
        </span>
      </div>

      {/* retro segmented progress bar */}
      <div
        className="sticker mt-3 h-5 overflow-hidden rounded-full bg-sunk p-0.5"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Preparation progress"
      >
        <motion.div
          className={cn(
            "stripes h-full rounded-full",
            submitted ? "bg-confirmed" : pct === 100 ? "bg-accent" : "bg-primary",
          )}
          initial={false}
          animate={{ width: `${Math.max(pct, pct > 0 ? 6 : 0)}%` }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        />
      </div>

      <ul className="sticker mt-4 divide-y-2 divide-border overflow-hidden rounded-xl bg-card">
        {steps.map((step) => {
          const on = done.includes(step.id);
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => toggleStep(program.id, step.id)}
                aria-pressed={on}
                className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-secondary"
              >
                <motion.span
                  aria-hidden
                  animate={on ? { scale: [1, 1.22, 1] } : { scale: 1 }}
                  transition={{ duration: 0.28 }}
                  className={cn(
                    "mt-0.5 grid size-6 shrink-0 place-items-center rounded-[6px] border-2 border-border",
                    on ? "bg-confirmed" : "bg-background",
                  )}
                >
                  <AnimatePresence>
                    {on && (
                      <motion.span
                        initial={{ scale: 0, rotate: -25 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 520, damping: 22 }}
                      >
                        <Check className="size-4 text-card" strokeWidth={4} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.span>

                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm font-bold",
                      on && "text-muted-foreground line-through decoration-2",
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{step.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <motion.button
        type="button"
        whileTap={{ y: 2 }}
        onClick={() => toggleSubmitted(program.id)}
        aria-pressed={submitted}
        className={cn(
          "sticker tap mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-bold active:sticker-press sm:w-auto",
          submitted ? "bg-confirmed text-card" : "bg-card hover:bg-secondary",
        )}
      >
        <Send className="size-4" aria-hidden />
        {submitted ? "Marked as submitted" : "I submitted this application"}
      </motion.button>

      {submitted && (
        <p className="mt-2 text-xs text-muted-foreground">
          Nice. Put the decision date in your calendar so a quiet inbox in April does not turn into
          a missed acceptance.
        </p>
      )}
    </section>
  );
}
