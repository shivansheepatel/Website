/**
 * /dashboard — the student's own progress.
 *
 * Deliberately not a vanity screen. Everything here counts something the
 * student actually did: programs saved, prep steps ticked, applications
 * submitted, cohorts being watched. No streaks, no points for logging in, no
 * pressure mechanics — the reward for opening this page is seeing that the
 * work is real and where it stands.
 *
 * Saved programs are grouped by what to do about them, not alphabetically,
 * because "three of these close this month" is the only sorting that matters.
 */

import { useMemo } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Award, Bell, Compass, ListChecks, Send, Sparkles } from "lucide-react";

import { FEATURES, MASCOT, SITE } from "@/config/site";
import { dashboardGreeting } from "@/lib/dialogue";
import { badgeProgress, earnedCount } from "@/lib/badges";
import { downloadIcs } from "@/lib/ics";
import { normalizeAll, PHASE_LABELS, type LifecyclePhase } from "@/lib/program-schema";
import { cn } from "@/lib/utils";
import { useNow } from "@/state/now";
import { useOnboarding } from "@/state/onboarding";
import { Byte } from "@/components/mascot/Byte";
import { SpeechBubble } from "@/components/mascot/SpeechBubble";
import { ProgramCard } from "@/components/ProgramCard";
import { stepsForProgram } from "@/components/lifecycle/PrepChecklist";
import { RetroLoader } from "@/components/motion/RetroLoader";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: `My dashboard — ${SITE.name}` },
      {
        name: "description",
        content: "Saved programs, application progress and earned badges — kept in your browser.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

/** Saved programs, grouped by what the student should do about them. */
const GROUP_ORDER: { phase: LifecyclePhase; heading: string; note: string }[] = [
  { phase: "open", heading: "Act now", note: "Applications are open. The countdown is real." },
  { phase: "opening-soon", heading: "Prepare", note: "Not open yet — this is the run-up." },
  { phase: "in-session", heading: "Running", note: "Happening now. Watch for the next cohort." },
  { phase: "rolling", heading: "Any time", note: "No fixed date. Apply when you are ready." },
  { phase: "closed", heading: "Closed", note: "This cycle is over — worth a look next year." },
];

function Stat({ icon: Icon, label, value }: { icon: typeof Award; label: string; value: number }) {
  return (
    <div className="sticker rounded-xl bg-card p-4">
      <p className="kicker flex items-center gap-1.5">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </p>
      <p className="tabular mt-1 font-display text-3xl leading-none font-bold">{value}</p>
    </div>
  );
}

function Dashboard() {
  const now = useNow();
  const {
    hydrated,
    saved,
    submitted,
    alerts,
    totalSteps,
    stepsFor,
    isSaved,
    toggleSaved,
    openQuiz,
    personalised,
  } = useOnboarding();

  const all = useMemo(() => normalizeAll(now), [now]);
  const savedPrograms = useMemo(() => all.filter((p) => saved.includes(p.id)), [all, saved]);
  const watching = useMemo(() => all.filter((p) => alerts.includes(p.id)), [all, alerts]);
  const submittedPrograms = useMemo(
    () => all.filter((p) => submitted.includes(p.id)),
    [all, submitted],
  );

  const distinctCategories = useMemo(
    () => new Set(savedPrograms.map((p) => p.category)).size,
    [savedPrograms],
  );

  const badges = useMemo(
    () =>
      badgeProgress({
        saved: saved.length,
        steps: totalSteps,
        submitted: submitted.length,
        categories: distinctCategories,
      }),
    [saved.length, totalSteps, submitted.length, distinctCategories],
  );

  const greeting = dashboardGreeting(saved.length, totalSteps);

  if (!hydrated) return <RetroLoader label="Loading your dashboard" />;

  const grouped = GROUP_ORDER.map((g) => ({
    ...g,
    items: savedPrograms.filter((p) => p.phase === g.phase),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10 print-full">
      <header className="border-b-2 border-rule pb-6">
        <p className="kicker">Progress tracker</p>
        <h1 className="mt-1.5 font-display text-3xl leading-tight font-bold sm:text-4xl">
          Where everything stands
        </h1>

        {MASCOT.enabled && (
          <div className="mt-5 flex items-start gap-3">
            <Byte mood={greeting.mood} size="md" />
            <div className="min-w-0 max-w-lg flex-1 pt-1">
              <SpeechBubble text={greeting.text} />
            </div>
          </div>
        )}
      </header>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Compass} label="Saved" value={saved.length} />
        <Stat icon={ListChecks} label="Prep steps done" value={totalSteps} />
        <Stat icon={Send} label="Submitted" value={submitted.length} />
        <Stat icon={Award} label="Badges earned" value={earnedCount(badges)} />
      </dl>

      {/* ------------------------------------------------------------ badges */}
      {FEATURES.badges && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">Badges</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Earned by doing real things — saving, preparing, submitting. Nothing here is awarded for
            time spent on the site.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((b, i) => (
              <motion.li
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 340, damping: 28 }}
                className={cn(
                  "sticker flex items-center gap-3 rounded-xl p-4",
                  b.earned ? "bg-accent/18" : "bg-card",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "pixel-corner grid size-11 shrink-0 place-items-center border-2 border-border font-display text-lg font-bold",
                    b.earned
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {b.earned ? "★" : "·"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{b.label}</span>
                  <span className="block text-xs text-muted-foreground">{b.blurb}</span>
                  {!b.earned && (
                    <span className="tabular mt-1 block text-xs font-bold text-muted-foreground">
                      {b.have} / {b.need}
                    </span>
                  )}
                </span>
              </motion.li>
            ))}
          </ul>
        </section>
      )}

      {/* ------------------------------------------------------------- saved */}
      <section className="mt-12">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl font-bold">Saved programs</h2>
          {savedPrograms.length > 0 && FEATURES.calendarExport && (
            <button
              type="button"
              onClick={() => downloadIcs(savedPrograms, "my-saved-programs.ics")}
              className="sticker tap ml-auto rounded-full bg-card px-4 text-sm font-bold active:sticker-press"
            >
              Export to calendar
            </button>
          )}
        </div>

        {savedPrograms.length === 0 ? (
          <div className="sticker mt-4 rounded-xl bg-card p-8 text-center">
            <p className="font-bold">Nothing saved yet.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Hit the bookmark on anything that looks interesting and it lands here, grouped by what
              you need to do about it.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link
                to="/explore"
                className="sticker tap inline-flex items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground active:sticker-press"
              >
                <Compass className="size-4" aria-hidden />
                Browse the catalogue
              </Link>
              {!personalised && (
                <button
                  type="button"
                  onClick={openQuiz}
                  className="sticker tap inline-flex items-center gap-2 rounded-full bg-card px-5 text-sm font-bold active:sticker-press"
                >
                  <Sparkles className="size-4" aria-hidden />
                  Ask {MASCOT.name} instead
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-8">
            {grouped.map((g) => (
              <div key={g.phase}>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h3 className="font-display text-lg font-bold">{g.heading}</h3>
                  <span className="tabular kicker">{g.items.length}</span>
                  <span className="text-xs text-muted-foreground">{g.note}</span>
                </div>
                <ul className="mt-3 grid gap-4 sm:grid-cols-2">
                  {g.items.map((p, i) => {
                    const steps = stepsForProgram(p);
                    const done = stepsFor(p.id).filter((id) =>
                      steps.some((s) => s.id === id),
                    ).length;
                    return (
                      <li key={p.id}>
                        <ProgramCard
                          program={p}
                          index={i}
                          saved={isSaved(p.id)}
                          onToggleSave={toggleSaved}
                          onAddToCalendar={(prog) => downloadIcs([prog], `${prog.id}.ics`)}
                          reasons={
                            done > 0 ? [`${done} of ${steps.length} prep steps done`] : undefined
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------- watching */}
      {watching.length > 0 && (
        <section className="mt-12">
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Bell className="size-5" aria-hidden />
            Watching for the next cohort
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These are closed or already running. The site does not email you — it has no idea who
            you are — so this is a list to check back on, and the dates are in your calendar export.
          </p>
          <ul className="mt-4 grid gap-2.5">
            {watching.map((p) => (
              <li key={p.id}>
                <Link
                  to="/program/$programId"
                  params={{ programId: p.id }}
                  className="sticker flex flex-wrap items-center gap-3 rounded-xl bg-card p-4 hover:bg-secondary"
                >
                  <span className="min-w-0 flex-1 basis-48">
                    <span className="block text-sm font-bold">{p.title}</span>
                    <span className="block text-xs text-muted-foreground">{p.org}</span>
                  </span>
                  <span className="kicker">{PHASE_LABELS[p.phase]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* --------------------------------------------------------- submitted */}
      {submittedPrograms.length > 0 && (
        <section className="mt-12">
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Send className="size-5" aria-hidden />
            Applications submitted
          </h2>
          <ul className="mt-4 grid gap-2.5">
            {submittedPrograms.map((p) => (
              <li
                key={p.id}
                className="sticker flex flex-wrap items-center gap-3 rounded-xl bg-confirmed/12 p-4"
              >
                <span className="min-w-0 flex-1 basis-48">
                  <Link
                    to="/program/$programId"
                    params={{ programId: p.id }}
                    className="text-sm font-bold hover:text-primary"
                  >
                    {p.title}
                  </Link>
                  <span className="block text-xs text-muted-foreground">{p.org}</span>
                </span>
                <span className="kicker text-confirmed">Submitted</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
