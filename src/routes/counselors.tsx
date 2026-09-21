/**
 * /counselors — the adults' side of the site.
 *
 * Two things counsellors actually asked for, in order of usefulness:
 *
 *  1. A SHARE LINK BUILDER. Filtered views are already URLs, so the highest-
 *     value feature is a form that constructs one: "free programs open to
 *     Grade 11 in the arts" becomes a link you paste into an email to thirty
 *     students, and each of them lands on exactly that list.
 *
 *  2. BATCH CHECKLISTS. A printable sheet of the prep steps for a set of
 *     programs, so a caseload meeting runs off paper rather than a screen.
 *
 * Plus the guidance articles, which live in `src/data/resources.ts` so a board
 * can replace them with their own without touching a component.
 */

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, ClipboardCopy, Clock, Link2, Printer } from "lucide-react";

import { FEATURES, PREP_STEPS, SITE } from "@/config/site";
import { CATEGORIES } from "@/data/programs";
import { ARTICLES, CHECKLISTS } from "@/data/resources";
import { INTERESTS } from "@/data/taxonomy";
import { formatDate } from "@/lib/dates";
import { COST_LABELS, normalizeAll, PHASE_LABELS } from "@/lib/program-schema";
import { cn } from "@/lib/utils";
import { useNow } from "@/state/now";

const TITLE = `Counsellors & parents — ${SITE.name}`;
const DESCRIPTION =
  "Build a shareable filtered link for a class, print batch application checklists, and read plain-language guides to how the deadlines work.";

export const Route = createFileRoute("/counselors")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Counselors,
});

type Audience = "student" | "counsellor" | "parent";

const AUDIENCES: { id: Audience; label: string; blurb: string }[] = [
  { id: "counsellor", label: "Counsellors", blurb: "Run this across a whole caseload" },
  { id: "parent", label: "Parents", blurb: "Help without taking it over" },
  { id: "student", label: "Students", blurb: "Get an application actually finished" },
];

function Counselors() {
  const now = useNow();
  const all = useMemo(() => normalizeAll(now), [now]);

  /* ------------------------------------------------ share link builder */
  const [grade, setGrade] = useState<number | "">("");
  const [cost, setCost] = useState("");
  const [track, setTrack] = useState("");
  const [phase, setPhase] = useState("actionable");
  const [copied, setCopied] = useState(false);

  const shareQuery = useMemo(() => {
    const qs = new URLSearchParams();
    if (grade !== "") qs.set("grade", String(grade));
    if (cost) qs.set("cost", cost);
    if (track) qs.set("track", track);
    if (phase !== "actionable") qs.set("phase", phase);
    const s = qs.toString();
    return `/explore${s ? `?${s}` : ""}`;
  }, [grade, cost, track, phase]);

  const shareUrl = `${SITE.url || "https://your-domain.example"}${shareQuery}`;

  const matching = useMemo(() => {
    return all.filter((p) => {
      if (grade !== "" && !p.grades.includes(Number(grade))) return false;
      if (cost && p.costTier !== cost) return false;
      if (track) {
        const t = INTERESTS.find((x) => x.id === track);
        if (
          t &&
          !(
            t.categories.includes(p.category) &&
            (!t.keywords || t.keywords.some((k) => p.haystack.includes(k)))
          )
        )
          return false;
      }
      if (phase === "actionable" && (p.phase === "closed" || p.phase === "in-session"))
        return false;
      if (phase !== "actionable" && phase !== "any" && p.phase !== phase) return false;
      return true;
    });
  }, [all, grade, cost, track, phase]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  /* -------------------------------------------------------- guidance */
  const [audience, setAudience] = useState<Audience>("counsellor");
  const lists = CHECKLISTS.filter((c) => c.audience === audience);
  const articles = ARTICLES.filter((a) => a.audience === audience);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10 print-full">
      <header className="border-b-2 border-rule pb-6">
        <p className="kicker">For the adults in the room</p>
        <h1 className="mt-1.5 font-display text-3xl leading-tight font-bold text-balance sm:text-4xl">
          Send thirty students to exactly the right list.
        </h1>
        <p className="mt-3 max-w-prose text-foreground/75">
          Every filtered view here is a plain URL. Build one below, paste it into an email or a
          Classroom post, and each student lands on that exact set — no account, no login, nothing
          to install.
        </p>
      </header>

      {/* ------------------------------------------------ link builder */}
      <section className="sticker no-print mt-8 rounded-2xl bg-surface p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <Link2 className="size-5" aria-hidden />
          Share link builder
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="kicker">Grade</span>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value === "" ? "" : Number(e.target.value))}
              className="sticker tap mt-1.5 w-full rounded-lg bg-card px-3 text-sm font-bold"
            >
              <option value="">Any grade</option>
              {SITE.grades.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="kicker">Cost</span>
            <select
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="sticker tap mt-1.5 w-full rounded-lg bg-card px-3 text-sm font-bold"
            >
              <option value="">Any cost</option>
              {(["free", "earns", "aid", "paid"] as const).map((c) => (
                <option key={c} value={c}>
                  {COST_LABELS[c]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="kicker">Track</span>
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              className="sticker tap mt-1.5 w-full rounded-lg bg-card px-3 text-sm font-bold"
            >
              <option value="">Any track</option>
              {INTERESTS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="kicker">Application status</span>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="sticker tap mt-1.5 w-full rounded-lg bg-card px-3 text-sm font-bold"
            >
              <option value="actionable">Anything they can act on</option>
              <option value="open">Applications open</option>
              <option value="opening-soon">Opening soon</option>
              <option value="rolling">Rolling intake</option>
              <option value="any">Everything, including closed</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <code className="sticker min-w-0 flex-1 basis-64 truncate rounded-lg bg-card px-3 py-2.5 font-mono text-xs">
            {shareUrl}
          </code>
          <motion.button
            whileTap={{ y: 2 }}
            type="button"
            onClick={copy}
            className={cn(
              "sticker tap inline-flex items-center gap-2 rounded-full px-4 text-sm font-bold active:sticker-press",
              copied ? "bg-confirmed text-card" : "bg-primary text-primary-foreground",
            )}
          >
            {copied ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <ClipboardCopy className="size-4" aria-hidden />
            )}
            {copied ? "Copied" : "Copy link"}
          </motion.button>
        </div>

        <p className="tabular mt-3 text-sm text-muted-foreground">
          <strong className="text-foreground">{matching.length}</strong> listings match right now.
          {!SITE.url && (
            <>
              {" "}
              Set <code className="font-mono text-xs">SITE.url</code> in{" "}
              <code className="font-mono text-xs">config/site.ts</code> and this becomes your real
              domain.
            </>
          )}
        </p>
      </section>

      {/* --------------------------------------------- batch checklist */}
      {FEATURES.printExport && (
        <section className="mt-10">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-bold">Batch checklist</h2>
            <button
              type="button"
              onClick={() => window.print()}
              className="sticker no-print tap ml-auto inline-flex items-center gap-2 rounded-full bg-card px-4 text-sm font-bold active:sticker-press"
            >
              <Printer className="size-4" aria-hidden />
              Print this page
            </button>
          </div>
          <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
            The {Math.min(matching.length, 12)} nearest deadlines from the selection above, with the
            standard preparation steps beside each. Print it and a caseload meeting runs off paper.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border text-left">
                  <th className="py-2 pr-3 font-display">Program</th>
                  <th className="py-2 pr-3 font-display">Status</th>
                  <th className="py-2 pr-3 font-display">Deadline</th>
                  <th className="py-2 font-display">Cost</th>
                </tr>
              </thead>
              <tbody>
                {matching.slice(0, 12).map((p) => (
                  <tr key={p.id} className="border-b border-rule align-top">
                    <td className="py-2.5 pr-3">
                      <span className="font-bold">{p.title}</span>
                      <span className="block text-xs text-muted-foreground">{p.org}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-xs">{PHASE_LABELS[p.phase]}</td>
                    <td className="tabular py-2.5 pr-3 text-xs">
                      {p.deadline ? formatDate(p.deadline) : "Rolling"}
                    </td>
                    <td className="py-2.5 text-xs">{COST_LABELS[p.costTier]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sticker mt-5 rounded-xl bg-card p-5 print-block">
            <h3 className="font-display text-lg font-bold">Standard preparation steps</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {PREP_STEPS.map((s) => (
                <li key={s.id} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 rounded-[4px] border-2 border-border"
                  />
                  <span>
                    <span className="block text-sm font-bold">{s.label}</span>
                    <span className="block text-xs text-muted-foreground">{s.hint}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------ guidance */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Guides</h2>
        <div
          className="no-print mt-4 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Choose who this is for"
        >
          {AUDIENCES.map((a) => (
            <button
              key={a.id}
              role="tab"
              type="button"
              aria-selected={audience === a.id}
              onClick={() => setAudience(a.id)}
              className={cn(
                "sticker tap flex flex-col justify-center rounded-xl px-4 py-2 text-left active:sticker-press",
                audience === a.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card hover:bg-secondary",
              )}
            >
              <span className="text-sm font-bold">{a.label}</span>
              <span
                className={cn(
                  "text-xs",
                  audience === a.id ? "text-primary-foreground/80" : "text-muted-foreground",
                )}
              >
                {a.blurb}
              </span>
            </button>
          ))}
        </div>

        {lists.map((list) => (
          <div key={list.id} className="mt-6 print-block">
            <h3 className="font-display text-xl font-bold">{list.title}</h3>
            <p className="mt-1.5 max-w-prose text-sm text-foreground/75">{list.intro}</p>
            <ul className="sticker mt-4 divide-y-2 divide-border overflow-hidden rounded-xl bg-card">
              {list.items.map((item) => (
                <li key={item.text} className="flex gap-3 p-4">
                  <span
                    aria-hidden
                    className="mt-0.5 size-5 shrink-0 rounded-[5px] border-2 border-border"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{item.text}</span>
                    {item.detail && (
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {item.detail}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {articles.length > 0 && (
          <div className="mt-10 space-y-6">
            {articles.map((a) => (
              <article key={a.id} className="sticker rounded-xl bg-card p-6 print-block">
                <p className="kicker flex items-center gap-1.5">
                  <Clock className="size-3.5" aria-hidden />
                  {a.readingMinutes} min read
                </p>
                <h3 className="mt-1.5 font-display text-xl leading-snug font-bold">{a.title}</h3>
                <p className="mt-2 font-medium text-foreground/85">{a.standfirst}</p>
                <div className="mt-3 max-w-prose space-y-3 text-sm leading-relaxed text-foreground/80">
                  {a.body.map((para) => (
                    <p key={para.slice(0, 32)}>{para}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
