/**
 * /program/:programId — the full record for one opportunity.
 *
 * A real page rather than a modal, because these are the URLs students send
 * each other and counsellors paste into emails. It needs a title, a canonical
 * URL and a share card of its own.
 *
 * The header rearranges itself around the lifecycle phase — see
 * `getProgramStatus()` — so the first thing on screen is always the thing the
 * student can do next, whether that is applying, preparing, or waiting.
 */

import { useMemo, useState } from "react";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  BellRing,
  Bookmark,
  BookmarkCheck,
  CalendarClock,
  CalendarPlus,
  Clock,
  Coins,
  Flag,
  ListChecks,
  MapPin,
  PlayCircle,
  ShieldCheck,
  Users,
} from "lucide-react";

import { FEATURES, SITE } from "@/config/site";
import { PROGRAMS } from "@/data/programs";
import { CATEGORY_META } from "@/lib/category";
import { formatDate, formatRange, usualMonth } from "@/lib/dates";
import { downloadIcs } from "@/lib/ics";
import {
  COMMITMENT_LABELS,
  COST_LABELS,
  DELIVERY_LABELS,
  normalize,
  normalizeAll,
  PHASE_GUIDANCE,
  PHASE_LABELS,
} from "@/lib/program-schema";
import { cn } from "@/lib/utils";
import { useNow } from "@/state/now";
import { useOnboarding } from "@/state/onboarding";
import { Countdown } from "@/components/lifecycle/Countdown";
import { PhaseBadge, UnknownDate, VerificationChip } from "@/components/lifecycle/PhaseBadge";
import { PrepChecklist } from "@/components/lifecycle/PrepChecklist";
import { ReportDialog } from "@/components/ReportDialog";

export const Route = createFileRoute("/program/$programId")({
  loader: ({ params }) => {
    const program = PROGRAMS.find((p) => p.id === params.programId);
    if (!program) throw notFound();
    return { program };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.program;
    if (!p) return {};
    const title = `${p.title} — ${p.org} | ${SITE.name}`;
    return {
      meta: [
        { title },
        { name: "description", content: p.summary },
        { property: "og:title", content: title },
        { property: "og:description", content: p.summary },
        { property: "og:type", content: "article" },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOccupationalProgram",
            name: p.title,
            description: p.summary,
            provider: { "@type": "Organization", name: p.org },
            url: p.url,
            ...(p.deadline ? { applicationDeadline: p.deadline } : {}),
            ...(p.appOpenDate ? { applicationStartDate: p.appOpenDate } : {}),
            ...(p.programStartDate ? { startDate: p.programStartDate } : {}),
            ...(p.programEndDate ? { endDate: p.programEndDate } : {}),
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">We do not have that one</h1>
      <p className="mt-3 text-muted-foreground">
        The listing may have been renamed or removed from the directory.
      </p>
      <Link
        to="/explore"
        className="sticker tap mt-6 inline-flex items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
      >
        Browse everything
      </Link>
    </div>
  ),
  component: ProgramDetail,
});

function Fact({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  note?: string | undefined;
}) {
  return (
    <div className="sticker rounded-xl bg-surface p-4">
      <dt className="kicker flex items-center gap-1.5">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </dt>
      <dd className="mt-1.5 text-sm leading-snug font-bold">{value}</dd>
      {note && <p className="mt-1 text-xs font-normal text-muted-foreground">{note}</p>}
    </div>
  );
}

function ProgramDetail() {
  const { program: raw } = Route.useLoaderData();
  const now = useNow();
  const { isSaved, toggleSaved, hydrated, hasAlert, toggleAlert } = useOnboarding();
  const [tab, setTab] = useState<"overview" | "prepare">("overview");

  const program = useMemo(() => normalize(raw, now), [raw, now]);
  const meta = CATEGORY_META[program.category];
  const Icon = meta.icon;
  const saved = hydrated && isSaved(program.id);
  const watching = hydrated && hasAlert(program.id);

  const similar = useMemo(
    () =>
      normalizeAll(now)
        .filter(
          (p) => p.id !== program.id && p.category === program.category && p.phase !== "closed",
        )
        .slice(0, 4),
    [now, program.id, program.category],
  );

  /* -------------------------------------------- the phase-specific header */
  const lifecycleHeader = (() => {
    switch (program.phase) {
      case "opening-soon":
        return (
          <div className="sticker rounded-xl border-phase-soon/50 bg-phase-soon/10 p-5">
            <p className="kicker flex items-center gap-1.5 text-phase-soon">
              <CalendarClock className="size-3.5" aria-hidden />
              Applications open {formatDate(program.appOpenDate ?? null)}
            </p>
            <p className="mt-2 font-display text-2xl font-bold">
              {program.daysUntilOpen} days to get ready
            </p>
            <p className="mt-2 max-w-prose text-sm text-foreground/80">
              {PHASE_GUIDANCE["opening-soon"]}
            </p>
            <button
              type="button"
              onClick={() => setTab("prepare")}
              className="sticker tap mt-3 inline-flex items-center gap-2 rounded-full bg-card px-4 text-sm font-bold active:sticker-press"
            >
              <ListChecks className="size-4" aria-hidden />
              Open the prep checklist
            </button>
          </div>
        );

      case "open":
        return (
          <div
            className={cn(
              "sticker rounded-xl p-5",
              program.urgency === "closing-soon"
                ? "caution border-coral/50"
                : "border-phase-open/50 bg-phase-open/10",
            )}
          >
            <p
              className={cn(
                "kicker",
                program.urgency === "closing-soon" ? "text-coral" : "text-phase-open",
              )}
            >
              {program.urgency === "closing-soon" ? "Closing soon" : "Applications open"}
            </p>
            <Countdown target={program.deadline} className="mt-3" />
            <p className="mt-3 text-sm text-foreground/80">
              Closes {formatDate(program.deadline)}.{" "}
              {program.known.open ? `Opened ${formatDate(program.appOpenDate ?? null)}.` : ""}
            </p>
            {!program.known.open && <UnknownDate what="The open date is" className="mt-1.5" />}
          </div>
        );

      case "in-session":
        return (
          <div className="sticker rounded-xl border-phase-session/50 bg-phase-session/10 p-5">
            <p className="kicker flex items-center gap-1.5 text-phase-session">
              <PlayCircle className="size-3.5" aria-hidden />
              Running now
            </p>
            <p className="mt-2 font-display text-2xl font-bold">
              {formatRange(program.programStartDate ?? null, program.programEndDate ?? null)}
            </p>
            <p className="mt-2 max-w-prose text-sm text-foreground/80">
              {PHASE_GUIDANCE["in-session"]}
            </p>
            <button
              type="button"
              onClick={() => toggleAlert(program.id)}
              aria-pressed={watching}
              className={cn(
                "sticker tap mt-3 inline-flex items-center gap-2 rounded-full px-4 text-sm font-bold active:sticker-press",
                watching ? "bg-phase-session text-card" : "bg-card hover:bg-secondary",
              )}
            >
              {watching ? (
                <BellRing className="size-4" aria-hidden />
              ) : (
                <Bell className="size-4" aria-hidden />
              )}
              {watching ? "Watching for the next cohort" : "Alert me for the next cohort"}
            </button>
            {watching && (
              <p className="mt-2 text-xs text-muted-foreground">
                Saved in this browser. It appears on your dashboard under “Watching”.
              </p>
            )}
          </div>
        );

      case "closed": {
        const month = usualMonth(program.deadline);
        return (
          <div className="sticker rounded-xl bg-muted p-5">
            <p className="kicker">Closed for this cycle</p>
            <p className="mt-2 font-display text-2xl font-bold text-muted-foreground">
              Closed {formatDate(program.deadline)}
            </p>
            <p className="mt-2 max-w-prose text-sm text-foreground/75">
              {PHASE_GUIDANCE.closed}
              {month
                ? ` Historically that is ${month}, so start watching a couple of months before.`
                : ""}
            </p>
            <button
              type="button"
              onClick={() => toggleAlert(program.id)}
              aria-pressed={watching}
              className={cn(
                "sticker tap mt-3 inline-flex items-center gap-2 rounded-full px-4 text-sm font-bold active:sticker-press",
                watching ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary",
              )}
            >
              {watching ? (
                <BellRing className="size-4" aria-hidden />
              ) : (
                <Bell className="size-4" aria-hidden />
              )}
              {watching ? "On your watch list" : "Remind me next cycle"}
            </button>
          </div>
        );
      }

      default:
        return (
          <div className="sticker rounded-xl border-dashed bg-card p-5">
            <p className="kicker">Rolling intake</p>
            <p className="mt-2 font-display text-2xl font-bold">Apply whenever you are ready</p>
            <p className="mt-2 max-w-prose text-sm text-foreground/80">{PHASE_GUIDANCE.rolling}</p>
          </div>
        );
    }
  })();

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:py-10 print-full">
      <Link
        to="/explore"
        className="tap inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All opportunities
      </Link>

      <header className="mt-4 border-b-2 border-rule pb-7">
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
            Grades {program.grades.join(", ")}
          </span>
          <PhaseBadge program={program} />
          {program.equity && (
            <span className="inline-flex items-start gap-1.5 rounded-full border-2 border-equity/35 bg-equity/10 px-2.5 py-1 text-xs font-bold text-equity">
              <ShieldCheck className="mt-0.5 size-3 shrink-0" aria-hidden />
              {program.equity}
            </span>
          )}
        </div>

        <h1 className="mt-4 font-display text-3xl leading-tight font-bold text-balance sm:text-4xl">
          {program.title}
        </h1>
        <p className="mt-1.5 text-base text-muted-foreground">{program.org}</p>

        <div className="mt-5">{lifecycleHeader}</div>

        {/* live verification stamp */}
        <div className="sticker mt-4 inline-flex flex-wrap items-center gap-2 rounded-lg bg-surface px-3 py-2">
          <VerificationChip program={program} showHint />
          <span className="text-xs text-muted-foreground">
            Last verified{" "}
            <time dateTime={program.lastVerifiedAt}>{formatDate(program.lastChecked)}</time> (
            {program.ageInDays === 0 ? "today" : `${program.ageInDays} days ago`})
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <motion.a
            whileTap={{ y: 2 }}
            href={program.url}
            target="_blank"
            rel="noopener noreferrer"
            className="sticker tap inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground active:sticker-press sm:flex-none"
          >
            {program.phase === "open" ? "Apply on the official site" : "Open the official site"}
            <ArrowUpRight className="size-4" aria-hidden />
          </motion.a>
          <motion.button
            whileTap={{ y: 2 }}
            type="button"
            onClick={() => toggleSaved(program.id)}
            aria-pressed={saved}
            className={cn(
              "sticker tap inline-flex items-center gap-2 rounded-full px-4 text-sm font-bold active:sticker-press",
              saved ? "bg-coral text-coral-foreground" : "bg-card hover:bg-secondary",
            )}
          >
            {saved ? (
              <BookmarkCheck className="size-4" aria-hidden />
            ) : (
              <Bookmark className="size-4" aria-hidden />
            )}
            {saved ? "On my roadmap" : "Add to my roadmap"}
          </motion.button>
          {FEATURES.calendarExport && program.deadline && (
            <button
              type="button"
              onClick={() => downloadIcs([program], `${program.id}.ics`)}
              className="sticker tap inline-flex items-center gap-2 rounded-full bg-card px-4 text-sm font-bold active:sticker-press"
            >
              <CalendarPlus className="size-4" aria-hidden />
              Calendar
            </button>
          )}
        </div>
      </header>

      {/* ------------------------------------------------------------- tabs */}
      {FEATURES.prepChecklists && (
        <div className="no-print mt-6 flex gap-2" role="tablist" aria-label="Program sections">
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "prepare", label: "Prepare" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "sticker tap rounded-full px-5 text-sm font-bold active:sticker-press",
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="mt-6"
        >
          {tab === "overview" ? (
            <>
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Fact
                  icon={Coins}
                  label="Cost"
                  value={COST_LABELS[program.costTier]}
                  note={program.cost}
                />
                <Fact
                  icon={Clock}
                  label="Time commitment"
                  value={COMMITMENT_LABELS[program.commitment]}
                  note={program.format}
                />
                <Fact
                  icon={MapPin}
                  label="Where"
                  value={DELIVERY_LABELS[program.delivery]}
                  note={program.location}
                />
                <Fact
                  icon={Users}
                  label="Eligible grades"
                  value={`Grades ${program.grades.join(", ")}`}
                  note={program.equity}
                />
              </dl>

              {/* the four lifecycle dates, including the ones nobody published */}
              <section className="sticker mt-6 rounded-xl bg-surface p-5">
                <h2 className="kicker">Key dates</h2>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: "Applications open",
                      value: program.appOpenDate ?? null,
                      known: program.known.open,
                    },
                    {
                      label: "Application deadline",
                      value: program.deadline,
                      known: program.known.deadline,
                    },
                    {
                      label: "Program starts",
                      value: program.programStartDate ?? null,
                      known: program.known.runs,
                    },
                    {
                      label: "Program ends",
                      value: program.programEndDate ?? null,
                      known: Boolean(program.programEndDate),
                    },
                  ].map((row) => (
                    <div key={row.label} className="border-l-4 border-l-rule pl-3">
                      <dt className="text-xs font-bold text-muted-foreground">{row.label}</dt>
                      <dd className="mt-0.5 text-sm font-bold">
                        {row.known ? (
                          formatDate(row.value)
                        ) : (
                          <span className="font-normal text-muted-foreground">
                            Not published by the organiser
                          </span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
                {program.missingDates.length > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Most organisers publish only a closing date. Anything missing above is left
                    blank on purpose — a guessed date sends you to a form that does not exist yet.
                  </p>
                )}
              </section>

              <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
                <div className="space-y-6">
                  <section>
                    <h2 className="font-display text-xl font-bold">What it actually is</h2>
                    <p className="mt-2.5 max-w-prose leading-relaxed text-foreground/85">
                      {program.description}
                    </p>
                  </section>

                  <section className="sticker rounded-xl border-l-4 border-l-accent bg-accent/12 p-5">
                    <h2 className="font-display text-xl font-bold">Who can apply</h2>
                    <p className="mt-2 max-w-prose leading-relaxed text-foreground/85">
                      {program.eligibility}
                    </p>
                  </section>

                  {program.skills.length > 0 && (
                    <section>
                      <h2 className="font-display text-xl font-bold">Skills this builds</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Tagged from this listing&apos;s own description, not guessed.
                      </p>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {program.skills.map((s) => (
                          <li
                            key={s}
                            className="sticker rounded-full bg-card px-3 py-1.5 text-sm font-bold"
                          >
                            {s
                              .split("-")
                              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(" ")}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                    {SITE.disclaimer}{" "}
                    <ReportDialog>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-bold text-foreground underline underline-offset-4"
                      >
                        <Flag className="size-3.5" aria-hidden />
                        Something wrong here?
                      </button>
                    </ReportDialog>
                  </p>
                </div>

                {similar.length > 0 && (
                  <aside>
                    <h2 className="kicker">More in {program.category}</h2>
                    <ul className="mt-3 space-y-2">
                      {similar.map((p) => (
                        <li key={p.id}>
                          <Link
                            to="/program/$programId"
                            params={{ programId: p.id }}
                            className="sticker block rounded-xl bg-card p-3 hover:bg-secondary"
                          >
                            <span className="block text-sm leading-snug font-bold">{p.title}</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {p.org}
                            </span>
                            <span className="tabular mt-1.5 block text-xs font-bold text-muted-foreground">
                              {PHASE_LABELS[p.phase]} · {p.label}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </aside>
                )}
              </div>
            </>
          ) : (
            <PrepChecklist program={program} />
          )}
        </motion.div>
      </AnimatePresence>
    </article>
  );
}
