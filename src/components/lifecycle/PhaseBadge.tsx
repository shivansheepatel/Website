/**
 * Lifecycle and trust badges.
 *
 * The phase badge says where an application stands; the verification chip says
 * how much to trust the dates behind it. Keeping them separate matters — a
 * confidently-styled "Applications open" on a date nobody has checked in three
 * months is exactly the failure this project exists to avoid.
 */

import { CalendarClock, CalendarX2, CircleDashed, PlayCircle, Timer } from "lucide-react";
import { AlertTriangle, CheckCircle2, CircleHelp } from "lucide-react";

import {
  PHASE_LABELS,
  type LifecyclePhase,
  type NormalizedProgram,
  type VerificationStatus,
} from "@/lib/program-schema";
import { cn } from "@/lib/utils";

const PHASE_STYLE: Record<LifecyclePhase, string> = {
  "opening-soon": "bg-phase-soon/12 text-phase-soon border-phase-soon/45",
  open: "bg-phase-open/12 text-phase-open border-phase-open/45",
  "in-session": "bg-phase-session/12 text-phase-session border-phase-session/45",
  closed: "bg-muted text-phase-closed border-rule",
  rolling: "bg-transparent text-muted-foreground border-dashed border-rule",
};

const PHASE_ICON: Record<LifecyclePhase, typeof Timer> = {
  "opening-soon": CalendarClock,
  open: Timer,
  "in-session": PlayCircle,
  closed: CalendarX2,
  rolling: CircleDashed,
};

export function PhaseBadge({
  program,
  showLabel = true,
  className,
}: {
  program: NormalizedProgram;
  /** `false` shows only the countdown phrase, for tight card headers. */
  showLabel?: boolean;
  className?: string;
}) {
  const Icon = PHASE_ICON[program.phase];
  const urgent = program.phase === "open" && program.urgency === "closing-soon";

  return (
    <span
      className={cn(
        "tabular inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-xs font-bold",
        PHASE_STYLE[program.phase],
        urgent && "border-coral/50 bg-coral/14 text-coral",
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {showLabel ? `${PHASE_LABELS[program.phase]} · ${program.label}` : program.label}
    </span>
  );
}

const VERIFY: Record<
  VerificationStatus,
  { label: string; hint: string; className: string; icon: typeof CheckCircle2 }
> = {
  verified: {
    label: "Verified",
    hint: "Posted by the organiser and checked recently.",
    className: "text-confirmed",
    icon: CheckCircle2,
  },
  estimated: {
    label: "Estimated",
    hint: "Based on previous years — confirm it on the official page.",
    className: "text-estimated",
    icon: CircleHelp,
  },
  unposted: {
    label: "Not posted",
    hint: "The program runs, but no reliable date has been published.",
    className: "text-muted-foreground",
    icon: CircleDashed,
  },
  "needs-recheck": {
    label: "Needs re-checking",
    hint: "It has been a while since we last confirmed this listing.",
    className: "text-coral",
    icon: AlertTriangle,
  },
};

export function VerificationChip({
  program,
  showHint = false,
  className,
}: {
  program: NormalizedProgram;
  showHint?: boolean;
  className?: string;
}) {
  const meta = VERIFY[program.verificationStatus];
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5 text-xs", className)}>
      <span className={cn("inline-flex items-center gap-1 font-bold", meta.className)}>
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {meta.label}
      </span>
      {showHint && <span className="text-muted-foreground">{meta.hint}</span>}
    </span>
  );
}

/**
 * A short, honest line about a date the organiser has not published.
 * Rendered wherever a lifecycle date is missing, instead of a guess.
 */
export function UnknownDate({ what, className }: { what: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}
    >
      <CircleDashed className="size-3.5 shrink-0" aria-hidden />
      {what} not published by the organiser
    </span>
  );
}
