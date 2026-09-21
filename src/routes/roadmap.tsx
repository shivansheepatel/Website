/**
 * /roadmap — the personalised Student Launchpad.
 *
 * Four things a student gets here that a list cannot give them:
 *   1. every dated milestone — opens, closes, starts — laid out term by term,
 *      so the workload is visible before it arrives;
 *   2. a skill focus per term, drawn from what their matches actually reward;
 *   3. exports: one .ics for the lot, or a Google Calendar link per milestone;
 *   4. a print layout, for the conversation with a parent or counsellor.
 *
 * With no saved profile the page is still useful — it shows the shortlist and
 * offers the quiz, rather than being a locked door.
 */

import { useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  CalendarClock,
  CalendarDays,
  Compass,
  ExternalLink,
  PlayCircle,
  Printer,
  RefreshCw,
  Sparkles,
  Target,
  Timer,
  Trash2,
} from "lucide-react";

import { FEATURES, MASCOT, SITE } from "@/config/site";
import { INTERESTS_BY_ID, SKILLS_BY_ID } from "@/data/taxonomy";
import { formatDate, formatShort } from "@/lib/dates";
import { downloadIcs, googleCalendarUrl } from "@/lib/ics";
import { rankPrograms } from "@/lib/match";
import { buildRoadmap, milestoneLabel, roadmapPrograms, type Milestone } from "@/lib/roadmap";
import { normalizeAll } from "@/lib/program-schema";
import { cn } from "@/lib/utils";
import { useNow } from "@/state/now";
import { useOnboarding } from "@/state/onboarding";
import { Byte } from "@/components/mascot/Byte";
import { SpeechBubble } from "@/components/mascot/SpeechBubble";
import { ProgramCard } from "@/components/ProgramCard";
import { PhaseBadge } from "@/components/lifecycle/PhaseBadge";
import { RetroLoader } from "@/components/motion/RetroLoader";

const TITLE = `My roadmap — ${SITE.name}`;

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: TITLE },
      {
        name: "description",
        content:
          "A personalised, term-by-term plan of application dates and skill milestones, built from your own answers. Saved in your browser, never on a server.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Roadmap,
});

const KIND_ICON: Record<Milestone["kind"], typeof Timer> = {
  opens: CalendarClock,
  deadline: Timer,
  starts: PlayCircle,
};

const KIND_TONE: Record<Milestone["kind"], string> = {
  opens: "text-phase-soon",
  deadline: "text-coral",
  starts: "text-phase-session",
};

function Roadmap() {
  const now = useNow();
  const {
    profile,
    personalised,
    hydrated,
    openQuiz,
    resetProfile,
    saved,
    isSaved,
    toggleSaved,
    clearSaved,
  } = useOnboarding();
  const [showSkipped, setShowSkipped] = useState(false);

  const all = useMemo(() => normalizeAll(now), [now]);
  const ranked = useMemo(
    () => (personalised ? rankPrograms(all, profile) : []),
    [all, profile, personalised],
  );
  const { quarters, rolling } = useMemo(
    () => buildRoadmap(ranked, profile, { now }),
    [ranked, profile, now],
  );

  const savedPrograms = useMemo(() => all.filter((p) => saved.includes(p.id)), [all, saved]);

  const exportable = useMemo(() => {
    const fromRoadmap = roadmapPrograms(quarters);
    const ids = new Set(fromRoadmap.map((p) => p.id));
    return [...fromRoadmap, ...savedPrograms.filter((p) => !ids.has(p.id))];
  }, [quarters, savedPrograms]);

  const milestoneCount = quarters.reduce((n, q) => n + q.milestones.length, 0);
  const interestLabels = profile.interests
    .map((i) => INTERESTS_BY_ID.get(i)?.label)
    .filter((l): l is string => Boolean(l));

  /* ---------------------------------------------------------------- empty */

  if (!hydrated) return <RetroLoader label="Loading your roadmap" />;

  if (!personalised) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
        <div className="sticker flex flex-wrap items-start gap-4 rounded-2xl bg-card p-6">
          <Byte mood="curious" size="lg" />
          <div className="min-w-0 flex-1">
            <SpeechBubble
              text={`No plan yet. Give me four answers and I'll lay your deadlines out term by term — or skip it, the whole catalogue is open either way.`}
            />
          </div>
        </div>

        <p className="kicker mt-10">Your launchpad</p>
        <h1 className="mt-1.5 font-display text-3xl leading-tight font-bold text-balance sm:text-4xl">
          Four questions from a plan of your own.
        </h1>
        <p className="mt-3 max-w-prose text-base text-foreground/75">
          Tell {MASCOT.name} your grade, what you are into, what you want to get better at and what
          fits your life. It lives in this browser only — no account, nothing sent anywhere.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <motion.button
            whileTap={{ y: 2 }}
            type="button"
            onClick={openQuiz}
            className="sticker tap inline-flex items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground active:sticker-press"
          >
            <Sparkles className="size-4" aria-hidden />
            Build my roadmap
          </motion.button>
          <Link
            to="/explore"
            className="sticker tap inline-flex items-center gap-2 rounded-full bg-card px-5 text-sm font-bold active:sticker-press"
          >
            <Compass className="size-4" aria-hidden />
            Just browse everything
          </Link>
        </div>

        {savedPrograms.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-xl font-bold">
              Saved so far ({savedPrograms.length})
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These carry straight over when you take the quiz.
            </p>
            <ul className="mt-5 grid gap-5 sm:grid-cols-2">
              {savedPrograms.map((p, i) => (
                <li key={p.id}>
                  <ProgramCard
                    program={p}
                    index={i}
                    saved
                    onToggleSave={toggleSaved}
                    onAddToCalendar={(prog) => downloadIcs([prog], `${prog.id}.ics`)}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------ populated */

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10 print-full">
      <header className="border-b-2 border-rule pb-6">
        <p className="kicker">Your launchpad</p>
        <h1 className="mt-1.5 font-display text-3xl leading-tight font-bold sm:text-4xl">
          {profile.grade !== null ? `Grade ${profile.grade}` : "Your"} plan
          {profile.gradYear !== null ? `, graduating ${profile.gradYear}` : ""}
        </h1>

        <p className="mt-3 max-w-prose text-foreground/75">
          {ranked.length} opportunities match what you told {MASCOT.name}
          {interestLabels.length > 0 ? `: ${interestLabels.join(", ")}` : ""}. That works out to{" "}
          <strong className="tabular">{milestoneCount}</strong> dated milestones over the next few
          terms — opening dates, deadlines and start dates, soonest first.
        </p>

        <div className="no-print mt-5 flex flex-wrap gap-2">
          {FEATURES.calendarExport && exportable.length > 0 && (
            <motion.button
              whileTap={{ y: 2 }}
              type="button"
              onClick={() => downloadIcs(exportable, "my-roadmap.ics")}
              className="sticker tap inline-flex items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground active:sticker-press"
            >
              <CalendarDays className="size-4" aria-hidden />
              Export {exportable.length} programs to my calendar
            </motion.button>
          )}
          {FEATURES.printExport && (
            <button
              type="button"
              onClick={() => window.print()}
              className="sticker tap inline-flex items-center gap-2 rounded-full bg-card px-4 text-sm font-bold active:sticker-press"
            >
              <Printer className="size-4" aria-hidden />
              Print / save as PDF
            </button>
          )}
          <button
            type="button"
            onClick={openQuiz}
            className="sticker tap inline-flex items-center gap-2 rounded-full bg-card px-4 text-sm font-bold active:sticker-press"
          >
            <RefreshCw className="size-4" aria-hidden />
            Change my answers
          </button>
          <button
            type="button"
            onClick={resetProfile}
            className="tap rounded-full px-3 text-sm font-bold text-muted-foreground hover:text-foreground"
          >
            Start over
          </button>
        </div>

        <p className="no-print mt-3 text-xs text-muted-foreground">
          The .ics file imports into Apple Calendar, Google Calendar, Outlook and anything else that
          reads calendar files, with a reminder a week before each date. Individual dates also have
          a one-click Google link below.
        </p>
      </header>

      {/* ---------------------------------------------------------- timeline */}
      <ol className="relative mt-8 space-y-8 before:absolute before:top-2 before:bottom-2 before:left-[1.0625rem] before:w-0.5 before:bg-rule">
        {quarters.map((q, qi) => (
          <li
            key={q.key}
            style={{ ["--i" as string]: qi }}
            className="stagger relative pl-12 print-block sm:pl-14"
          >
            <span
              aria-hidden
              className={cn(
                "sticker absolute top-0.5 left-0 grid size-9 place-items-center rounded-lg font-display text-xs font-bold",
                q.isCurrent
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground",
              )}
            >
              {q.season.slice(0, 2)}
            </span>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-display text-2xl font-bold">{q.label}</h2>
              <span className="text-sm text-muted-foreground">{q.months}</span>
              {q.isCurrent && (
                <span className="rounded-full border-2 border-border bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                  You are here
                </span>
              )}
            </div>

            <p className="mt-2 max-w-prose text-sm leading-relaxed text-foreground/75">{q.focus}</p>

            {q.skillTags.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="kicker flex items-center gap-1">
                  <Target className="size-3.5" aria-hidden />
                  Focus on
                </span>
                {q.skillTags.map((s) => (
                  <span
                    key={s.id}
                    className={cn(
                      "rounded-full border-2 px-2.5 py-1 text-xs font-bold",
                      s.chosen
                        ? "border-primary/40 bg-primary/12 text-primary"
                        : "border-rule bg-card text-foreground/70",
                    )}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            )}

            {q.milestones.length === 0 ? (
              <p className="mt-4 rounded-xl border-2 border-dashed border-rule px-4 py-3 text-sm text-muted-foreground">
                No dated milestones this term. Use it to build the thing you will write about — or
                to get ahead on next term&apos;s applications.
              </p>
            ) : (
              <ul className="sticker mt-4 divide-y-2 divide-border overflow-hidden rounded-xl bg-card">
                {q.milestones.map((m) => {
                  const KindIcon = KIND_ICON[m.kind];
                  return (
                    <li key={m.id} className="flex flex-wrap items-start gap-3 p-4">
                      <span className="tabular w-14 shrink-0 text-xs font-bold text-muted-foreground">
                        {formatShort(m.date)}
                      </span>
                      <div className="min-w-0 flex-1 basis-48">
                        <span className={cn("kicker flex items-center gap-1.5", KIND_TONE[m.kind])}>
                          <KindIcon className="size-3.5" aria-hidden />
                          {milestoneLabel(m.kind)}
                        </span>
                        <Link
                          to="/program/$programId"
                          params={{ programId: m.program.id }}
                          className="mt-0.5 block font-bold transition-colors hover:text-primary"
                        >
                          {m.program.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{m.program.org}</p>
                        {m.reasons.length > 0 && (
                          <p className="mt-1.5 text-xs text-foreground/70">
                            {m.reasons.slice(0, 3).join(" · ")}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <PhaseBadge program={m.program} showLabel={false} />
                        <a
                          href={googleCalendarUrl(m.program, m.kind, m.date)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="no-print tap grid place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                          aria-label={`Add ${milestoneLabel(m.kind)} for ${m.program.title} to Google Calendar`}
                        >
                          <ExternalLink className="size-4" aria-hidden />
                        </a>
                        <button
                          type="button"
                          onClick={() => toggleSaved(m.program.id)}
                          aria-pressed={isSaved(m.program.id)}
                          className="no-print tap rounded-full px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
                        >
                          {isSaved(m.program.id) ? "Saved" : "Save"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        ))}
      </ol>

      {rolling.length > 0 && (
        <section className="mt-12 print-block">
          <h2 className="font-display text-2xl font-bold">Apply whenever you are ready</h2>
          <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
            These match you but publish no dates at all — rolling intake, open until full, or dates
            your school sets. They are kept off the timeline on purpose: a guessed date on a
            calendar is how real deadlines get missed.
          </p>
          <button
            type="button"
            onClick={() => setShowSkipped((v) => !v)}
            className="no-print tap mt-2 rounded-full text-sm font-bold text-primary underline underline-offset-4"
          >
            {showSkipped ? "Hide" : `Show all ${rolling.length}`}
          </button>
          {showSkipped && (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {rolling.map(({ program }) => (
                <li key={program.id}>
                  <Link
                    to="/program/$programId"
                    params={{ programId: program.id }}
                    className="sticker block rounded-xl bg-card p-4 hover:bg-secondary"
                  >
                    <span className="block text-sm font-bold">{program.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {program.org}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {savedPrograms.length > 0 && (
        <section className="mt-12 print-block">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-bold">
              Saved by you ({savedPrograms.length})
            </h2>
            <button
              type="button"
              onClick={clearSaved}
              className="no-print tap ml-auto inline-flex items-center gap-1.5 rounded-full px-3 text-sm font-bold text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="size-4" aria-hidden />
              Clear
            </button>
          </div>
          <ul className="mt-4 grid gap-5 sm:grid-cols-2">
            {savedPrograms.map((p, i) => (
              <li key={p.id}>
                <ProgramCard
                  program={p}
                  index={i}
                  saved
                  onToggleSave={toggleSaved}
                  onAddToCalendar={(prog) => downloadIcs([prog], `${prog.id}.ics`)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {profile.skills.length > 0 && (
        <section className="sticker mt-12 rounded-xl bg-surface p-6 print-block">
          <h2 className="font-display text-xl font-bold">The skills you picked</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {profile.skills.map((id) => (
              <li
                key={id}
                className="rounded-full border-2 border-primary/40 bg-primary/12 px-3 py-1.5 text-sm font-bold text-primary"
              >
                {SKILLS_BY_ID.get(id)?.label ?? id}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">
            Every program above was checked against these — a skill is only claimed when the
            listing&apos;s own description supports it.
          </p>
        </section>
      )}

      <p className="mt-10 text-xs text-muted-foreground">
        Generated {formatDate(new Date().toISOString().slice(0, 10))}. {SITE.disclaimer}
      </p>
    </div>
  );
}
