/**
 * / — the front door.
 *
 * Three jobs, in order: let a student search straight away, show them
 * something genuinely urgent, and offer Byte without putting the mascot in
 * the way of anyone who just wants the catalogue.
 */

import { useMemo, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, CircleDashed, CircleHelp, Compass, Timer } from "lucide-react";

import { HERO, LIFECYCLE, FEATURES, MASCOT, SITE } from "@/config/site";
import { CATEGORIES } from "@/data/programs";
import { INTERESTS, programMatchesTrack } from "@/data/taxonomy";
import { CATEGORY_META } from "@/lib/category";
import { formatShort } from "@/lib/dates";
import { rankPrograms } from "@/lib/match";
import { byUrgency, normalizeAll } from "@/lib/program-schema";
import { cn } from "@/lib/utils";
import { useNow } from "@/state/now";
import { useOnboarding } from "@/state/onboarding";
import { Byte } from "@/components/mascot/Byte";
import { SpeechBubble } from "@/components/mascot/SpeechBubble";
import { ProgramCard } from "@/components/ProgramCard";
import { SearchField } from "@/components/explore/SearchField";

const TITLE = `${SITE.name} — programs, contests & scholarships for high school students`;
const DESCRIPTION = `A free directory of summer programs, competitions, scholarships and paid positions for ${SITE.region} high school students, with every deadline labelled verified or estimated.`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE.url || "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE.name,
          description: DESCRIPTION,
        }),
      },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const now = useNow();
  const reduce = useReducedMotion();
  const { openQuiz, personalised, profile, isSaved, toggleSaved, hydrated } = useOnboarding();
  const [query, setQuery] = useState("");

  const all = useMemo(() => normalizeAll(now), [now]);

  const closingSoon = useMemo(
    () =>
      all
        .filter(
          (p) =>
            p.phase === "open" &&
            p.daysRemaining !== null &&
            p.daysRemaining <= LIFECYCLE.tickerHorizonDays &&
            p.verificationStatus === "verified",
        )
        .sort(byUrgency)
        .slice(0, 10),
    [all],
  );

  const picks = useMemo(
    () => (personalised ? rankPrograms(all, profile, 6) : []),
    [all, profile, personalised],
  );

  const stats = useMemo(() => {
    const open = all.filter((p) => p.phase !== "closed");
    return {
      total: all.length,
      open: open.length,
      free: open.filter((p) => p.costTier === "free" || p.costTier === "earns").length,
      verified: open.filter((p) => p.verificationStatus === "verified").length,
    };
  }, [all]);

  const trackCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const t of INTERESTS) {
      out[t.id] = all.filter(
        (p) => p.phase !== "closed" && programMatchesTrack(t, p.category, p.haystack),
      ).length;
    }
    return out;
  }, [all]);

  const runSearch = (q: string) =>
    void navigate({ to: "/explore", search: q.trim() ? { q: q.trim() } : {} });

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="cabinet-wash border-b-2 border-border">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-12 sm:pt-14">
          <div className="grid items-start gap-8 lg:grid-cols-[1.35fr_1fr]">
            <div>
              <p className="kicker">{HERO.eyebrow}</p>
              <h1 className="mt-3 max-w-[16ch] font-display text-4xl leading-[1.03] font-bold text-balance sm:text-5xl lg:text-6xl">
                {HERO.headline}
              </h1>
              <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-foreground/80">
                {stats.total} opportunities for {SITE.region} students in Grades 9–12.{" "}
                {HERO.subhead}
              </p>

              <div className="mt-6 max-w-xl">
                <SearchField
                  value={query}
                  onChange={setQuery}
                  programs={all}
                  onSubmit={runSearch}
                  placeholder="Try “robotics”, “free”, “scholarship”…"
                />
              </div>

              <dl className="mt-8 grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 border-t-2 border-rule pt-5 sm:grid-cols-3">
                {[
                  { label: "Open right now", value: stats.open },
                  { label: "Free or paid to you", value: stats.free },
                  { label: "Deadline verified", value: stats.verified },
                ].map((s) => (
                  <div key={s.label}>
                    <dt className="kicker">{s.label}</dt>
                    <dd className="tabular font-display text-3xl leading-none font-bold">
                      {s.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* ---- Byte's invitation ---- */}
            {MASCOT.enabled && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 320, damping: 28 }}
                className="sticker rounded-2xl bg-card p-5"
              >
                <div className="flex items-start gap-3">
                  <Byte mood={personalised ? "proud" : "excited"} size="lg" />
                  <div className="min-w-0 flex-1 pt-2">
                    <SpeechBubble
                      text={
                        personalised
                          ? "Your roadmap's ready whenever you are — I've laid the deadlines out term by term."
                          : `Hi, I'm ${MASCOT.name}. Four questions and I'll build you a plan that fits your grade, your budget and the time you actually have.`
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {personalised ? (
                    <motion.div whileTap={{ y: 2 }}>
                      <Link
                        to="/roadmap"
                        className="sticker tap inline-flex items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground active:sticker-press"
                      >
                        Open my roadmap
                        <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.button
                      type="button"
                      whileTap={{ y: 2 }}
                      onClick={openQuiz}
                      className="sticker tap inline-flex items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground active:sticker-press"
                    >
                      {MASCOT.callToAction}
                    </motion.button>
                  )}
                  <Link
                    to="/explore"
                    className="tap inline-flex items-center gap-2 rounded-full px-4 text-sm font-bold text-muted-foreground hover:text-foreground"
                  >
                    <Compass className="size-4" aria-hidden />
                    Skip &amp; explore directly
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- urgency ticker */}
      {FEATURES.closingSoonTicker && closingSoon.length > 0 && (
        <section aria-labelledby="closing-soon" className="border-b-2 border-border bg-card py-5">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="closing-soon" className="kicker flex items-center gap-1.5 text-coral">
              <Timer className="size-3.5" aria-hidden />
              Closing soon — verified deadlines
            </h2>
          </div>
          <div className="group mt-3 overflow-hidden">
            <ul className="ticker-track gap-3 px-4 group-hover:[animation-play-state:paused]">
              {[...closingSoon, ...closingSoon].map((p, i) => {
                const dup = i >= closingSoon.length;
                return (
                  <li key={`${p.id}-${i}`} className="w-60 shrink-0" aria-hidden={dup}>
                    <Link
                      to="/program/$programId"
                      params={{ programId: p.id }}
                      tabIndex={dup ? -1 : undefined}
                      className="sticker flex h-full flex-col gap-1.5 rounded-xl bg-background p-3.5 hover:bg-secondary"
                    >
                      <span
                        className={cn(
                          "flex items-center gap-2 text-xs font-bold",
                          CATEGORY_META[p.category].text,
                        )}
                      >
                        <span
                          className={cn("size-2 rounded-full", CATEGORY_META[p.category].dot)}
                          aria-hidden
                        />
                        {p.category}
                      </span>
                      <span className="line-clamp-2 text-sm leading-snug font-bold">{p.title}</span>
                      <span className="mt-auto text-xs text-muted-foreground">
                        {formatShort(p.deadline)}
                      </span>
                      <span
                        className={cn(
                          "tabular text-sm font-bold",
                          p.urgency === "closing-soon" ? "text-coral" : "text-phase-open",
                        )}
                      >
                        {p.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ------------------------------------------- category explorer */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="kicker">Pick a track</p>
        <h2 className="mt-1.5 font-display text-2xl font-bold sm:text-3xl">
          Where do you want to spend your year?
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {INTERESTS.map((track, i) => {
            const count = trackCounts[track.id] ?? 0;
            const meta = CATEGORY_META[track.categories[0] ?? "STEM"];
            return (
              <motion.li
                key={track.id}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  delay: Math.min(i, 6) * 0.04,
                  type: "spring",
                  stiffness: 320,
                  damping: 30,
                }}
              >
                <motion.div whileHover={reduce ? {} : { y: -3, rotate: -0.4 }} whileTap={{ y: 2 }}>
                  <Link
                    to="/explore"
                    search={{ track: track.id }}
                    className="sticker flex h-full items-center gap-3 rounded-xl bg-card p-4 hover:bg-secondary active:sticker-press"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "pixel-corner grid size-11 shrink-0 place-items-center border-2 border-border font-display text-lg font-bold",
                        meta.chip,
                      )}
                    >
                      {track.glyph}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug font-bold">{track.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {count === 0
                          ? "Nothing listed yet"
                          : count === 1
                            ? "1 listing — a known gap"
                            : track.blurb}
                      </span>
                    </span>
                    <span className="tabular shrink-0 rounded-full border-2 border-border bg-secondary px-2 py-0.5 text-xs font-bold">
                      {count}
                    </span>
                  </Link>
                </motion.div>
              </motion.li>
            );
          })}
        </ul>
      </section>

      {/* --------------------------------------------------- personal picks */}
      {hydrated && picks.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker">Picked for you</p>
              <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
                Based on what you told {MASCOT.name}
              </h2>
            </div>
            <Link
              to="/roadmap"
              className="sticker tap inline-flex items-center gap-2 rounded-full bg-card px-4 text-sm font-bold active:sticker-press"
            >
              See the full roadmap
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {picks.map(({ program, reasons }, i) => (
              <li key={program.id} className="h-full">
                <ProgramCard
                  program={program}
                  index={i}
                  reasons={reasons}
                  saved={isSaved(program.id)}
                  onToggleSave={toggleSaved}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ------------------------------------------------------------ trust */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="kicker">How to read a deadline here</p>
            <h2 className="mt-1.5 font-display text-2xl font-bold text-balance sm:text-3xl">
              We tell you what we actually know.
            </h2>
            <p className="mt-3 text-foreground/75">
              Roughly a third of programs have not posted this cycle&apos;s dates yet. Rather than
              guessing quietly, every listing says which of these it is — and how long ago we last
              checked.
            </p>
            <Link
              to="/counselors"
              className="sticker tap mt-5 inline-flex items-center gap-2 rounded-full bg-card px-4 text-sm font-bold active:sticker-press"
            >
              Guides for counsellors &amp; parents
            </Link>
          </div>

          <ul className="grid gap-3">
            {[
              {
                icon: CheckCircle2,
                tone: "text-confirmed",
                label: "Verified",
                body: "The organiser has posted this date for the current cycle and our daily check confirmed it recently. Plan around these.",
              },
              {
                icon: CircleHelp,
                tone: "text-estimated",
                label: "Estimated",
                body: "This cycle's date is not up yet, so we carry forward the date it usually falls on. Confirm before you build around it.",
              },
              {
                icon: CircleDashed,
                tone: "text-muted-foreground",
                label: "Not posted",
                body: "Rolling intake, open until full, or dates set locally. Not missing data — accurately represented uncertainty.",
              },
            ].map((row) => (
              <li key={row.label} className="sticker flex gap-3 rounded-xl bg-card p-5">
                <row.icon className={cn("mt-0.5 size-5 shrink-0", row.tone)} aria-hidden />
                <div>
                  <p className="font-display font-bold">{row.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/75">{row.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
