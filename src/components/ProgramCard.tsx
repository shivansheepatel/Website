/**
 * ============================================================================
 *  PROGRAM CARD — one component, five layouts
 * ============================================================================
 *
 * The card rearranges itself around whatever the student can actually DO right
 * now. That is the whole idea: a program opening in March and a program
 * closing on Friday need different things on screen, and showing the same
 * template for both wastes the most valuable line on the card.
 *
 *   opening-soon  → the open date, and what to line up before it
 *   open          → a live countdown and the route to applying
 *   in-session    → the run dates and a next-cohort reminder
 *   closed        → dimmed, with the month it usually closes
 *   rolling       → no countdown at all, because there is no date to count to
 *
 * `variant="compact"` is the list view: same information hierarchy, one row.
 */

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Bell,
  BellRing,
  Bookmark,
  BookmarkCheck,
  CalendarPlus,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

import { FEATURES } from "@/config/site";
import { CATEGORY_META } from "@/lib/category";
import { formatDate, formatRange, formatShort, usualMonth } from "@/lib/dates";
import { COST_LABELS, type NormalizedProgram } from "@/lib/program-schema";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/state/onboarding";
import { Countdown } from "@/components/lifecycle/Countdown";
import { PhaseBadge, UnknownDate, VerificationChip } from "@/components/lifecycle/PhaseBadge";
import { stepsForProgram } from "@/components/lifecycle/PrepChecklist";

interface Props {
  program: NormalizedProgram;
  saved: boolean;
  onToggleSave: (id: string) => void;
  onAddToCalendar?: ((program: NormalizedProgram) => void) | undefined;
  /** Why the matching engine surfaced this one. Shown as a quiet footnote. */
  reasons?: string[] | undefined;
  variant?: "grid" | "compact";
  index?: number;
}

/** A tinted rail down the left edge, coloured by phase. */
const RAIL: Record<string, string> = {
  "opening-soon": "before:bg-phase-soon",
  open: "before:bg-phase-open",
  "in-session": "before:bg-phase-session",
  closed: "before:bg-rule",
  rolling: "before:bg-rule",
};

export function ProgramCard({
  program,
  saved,
  onToggleSave,
  onAddToCalendar,
  reasons,
  variant = "grid",
  index = 0,
}: Props) {
  const reduce = useReducedMotion();
  const { hasAlert, toggleAlert, stepsFor, hydrated } = useOnboarding();
  const meta = CATEGORY_META[program.category];
  const Icon = meta.icon;

  const closed = program.phase === "closed";
  const urgent = program.phase === "open" && program.urgency === "closing-soon";
  const steps = stepsForProgram(program);
  const doneCount = hydrated
    ? stepsFor(program.id).filter((id) => steps.some((s) => s.id === id)).length
    : 0;

  /* ---------------------------------------------------------------- header */
  const header = (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-xs font-bold",
          meta.chip,
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {program.category}
      </span>
      <span className="rounded-full border-2 border-rule bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">
        Gr {program.grades.join(", ")}
      </span>
      <PhaseBadge program={program} showLabel={false} className="ml-auto" />
    </div>
  );

  /* ------------------------------------------------- the phase-specific bit */
  const lifecycleBlock = (() => {
    switch (program.phase) {
      case "opening-soon":
        return (
          <div className="rounded-lg border-2 border-phase-soon/40 bg-phase-soon/8 p-3">
            <p className="kicker text-phase-soon">Applications open</p>
            <p className="mt-1 text-sm font-bold">{formatDate(program.appOpenDate ?? null)}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {program.daysUntilOpen} days to line up references and draft your answers.
            </p>
          </div>
        );

      case "open":
        return (
          <div
            className={cn(
              "rounded-lg border-2 p-3",
              urgent ? "caution border-coral/45" : "border-phase-open/40 bg-phase-open/8",
            )}
          >
            <p className={cn("kicker", urgent ? "text-coral" : "text-phase-open")}>
              {urgent ? "Closing soon" : "Time left to apply"}
            </p>
            <Countdown target={program.deadline} className="mt-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              Closes {formatDate(program.deadline)}
            </p>
          </div>
        );

      case "in-session":
        return (
          <div className="rounded-lg border-2 border-phase-session/40 bg-phase-session/8 p-3">
            <p className="kicker text-phase-session">Running now</p>
            <p className="mt-1 text-sm font-bold">
              {formatRange(program.programStartDate ?? null, program.programEndDate ?? null)}
            </p>
            <button
              type="button"
              onClick={() => toggleAlert(program.id)}
              aria-pressed={hydrated && hasAlert(program.id)}
              className={cn(
                "sticker tap mt-2.5 inline-flex items-center gap-2 rounded-full px-3 text-xs font-bold active:sticker-press",
                hydrated && hasAlert(program.id)
                  ? "bg-phase-session text-card"
                  : "bg-card hover:bg-secondary",
              )}
            >
              {hydrated && hasAlert(program.id) ? (
                <BellRing className="size-3.5" aria-hidden />
              ) : (
                <Bell className="size-3.5" aria-hidden />
              )}
              {hydrated && hasAlert(program.id)
                ? "Watching for next cohort"
                : "Alert me for the next cohort"}
            </button>
          </div>
        );

      case "closed": {
        const month = usualMonth(program.deadline);
        return (
          <div className="rounded-lg border-2 border-rule bg-muted p-3">
            <p className="kicker">Closed for this cycle</p>
            <p className="mt-1 text-sm font-bold text-muted-foreground">
              Closed {formatShort(program.deadline)}
            </p>
            {month && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                This one usually closes in {month} — worth a look next {month}.
              </p>
            )}
          </div>
        );
      }

      default:
        return (
          <div className="rounded-lg border-2 border-dashed border-rule p-3">
            <p className="kicker">Rolling intake</p>
            <p className="mt-1 text-sm font-bold text-muted-foreground">
              Apply whenever you are ready
            </p>
            <UnknownDate what="A closing date is" className="mt-1.5" />
          </div>
        );
    }
  })();

  /* --------------------------------------------------------------- actions */
  const actions = (
    <div className="relative z-10 flex flex-wrap items-center gap-2">
      <motion.a
        whileTap={reduce ? {} : { y: 2 }}
        href={program.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "sticker tap inline-flex items-center gap-1.5 rounded-full px-4 text-sm font-bold active:sticker-press",
          program.phase === "open"
            ? "bg-primary text-primary-foreground"
            : "bg-card hover:bg-secondary",
        )}
      >
        {program.phase === "open"
          ? "Apply now"
          : program.phase === "opening-soon"
            ? "See the program"
            : "Official page"}
        <ArrowUpRight className="size-4" aria-hidden />
      </motion.a>

      {FEATURES.prepChecklists && doneCount > 0 && (
        <span className="tabular inline-flex items-center gap-1 rounded-full border-2 border-rule bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">
          <ListChecks className="size-3.5" aria-hidden />
          {doneCount}/{steps.length}
        </span>
      )}

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => onToggleSave(program.id)}
          aria-pressed={saved}
          aria-label={
            saved ? `Remove ${program.title} from my roadmap` : `Add ${program.title} to my roadmap`
          }
          className="tap grid place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {saved ? (
            <BookmarkCheck className="size-5 text-coral" aria-hidden />
          ) : (
            <Bookmark className="size-5" aria-hidden />
          )}
        </button>
        {FEATURES.calendarExport && program.deadline && onAddToCalendar && (
          <button
            type="button"
            onClick={() => onAddToCalendar(program)}
            aria-label={`Add the ${program.title} deadline to your calendar`}
            className="tap grid place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <CalendarPlus className="size-5" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );

  /* ------------------------------------------------------------- compact row */
  if (variant === "compact") {
    return (
      <article
        className={cn(
          "sticker relative flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-card p-4",
          "before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:rounded-l-[9px]",
          RAIL[program.phase],
          closed && "opacity-60",
        )}
      >
        <div className="min-w-0 flex-1 basis-56 pl-2">
          <h3 className="font-display text-base leading-snug font-bold">
            <Link
              to="/program/$programId"
              params={{ programId: program.id }}
              className="hover:text-primary"
            >
              <span className="absolute inset-0 rounded-xl" aria-hidden />
              {program.title}
            </Link>
          </h3>
          <p className="text-xs text-muted-foreground">
            {program.org} · {program.category} · Gr {program.grades.join(", ")}
          </p>
        </div>
        <span className="text-xs font-bold text-muted-foreground">
          {COST_LABELS[program.costTier]}
        </span>
        <PhaseBadge program={program} />
        <div className="relative z-10 flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleSave(program.id)}
            aria-pressed={saved}
            aria-label={saved ? "Remove from my roadmap" : "Add to my roadmap"}
            className="tap grid place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {saved ? (
              <BookmarkCheck className="size-5 text-coral" aria-hidden />
            ) : (
              <Bookmark className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </article>
    );
  }

  /* ---------------------------------------------------------------- grid card */
  return (
    <motion.article
      style={{ ["--i" as string]: Math.min(index, 8) }}
      whileHover={reduce ? {} : { y: -3, rotate: -0.35 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={cn(
        "stagger sticker relative flex h-full flex-col gap-3.5 rounded-xl bg-card p-5",
        "before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:rounded-l-[9px]",
        RAIL[program.phase],
        closed && "opacity-65",
      )}
    >
      {header}

      <div className="min-w-0">
        <h3 className="font-display text-lg leading-snug font-bold text-balance">
          <Link
            to="/program/$programId"
            params={{ programId: program.id }}
            className="transition-colors hover:text-primary"
          >
            <span className="absolute inset-0 rounded-xl" aria-hidden />
            {program.title}
          </Link>
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{program.org}</p>
      </div>

      <p className="text-sm leading-relaxed text-foreground/80">{program.summary}</p>

      {lifecycleBlock}

      <div className="mt-auto space-y-2">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
          <span
            className={cn(
              "font-bold",
              program.costTier === "earns" || program.costTier === "free"
                ? "text-confirmed"
                : "text-foreground/70",
            )}
          >
            {COST_LABELS[program.costTier]}
          </span>
          <span className="text-muted-foreground">·</span>
          <VerificationChip program={program} />
          {program.equity && (
            <span className="inline-flex items-start gap-1 rounded-full border-2 border-equity/30 bg-equity/10 px-2 py-0.5 leading-snug font-bold text-equity">
              <ShieldCheck className="mt-0.5 size-3 shrink-0" aria-hidden />
              {program.equity}
            </span>
          )}
        </div>

        {reasons && reasons.length > 0 && (
          <p className="rounded-lg border-l-4 border-l-accent bg-accent/12 px-2.5 py-1.5 text-xs text-foreground/80">
            {reasons.slice(0, 2).join(" · ")}
          </p>
        )}
      </div>

      {actions}
    </motion.article>
  );
}
