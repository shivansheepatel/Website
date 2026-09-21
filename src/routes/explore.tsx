/**
 * /explore — the full catalogue, three ways to look at it.
 *
 * Every filter lives in the URL. Not a purity exercise: it means a counsellor
 * can send "here are the free STEM programs open to you" as a link, the back
 * button behaves, and a filtered view can be bookmarked.
 *
 * The three views answer different questions:
 *   grid     — "what is out there?"          (browse, most detail per card)
 *   list     — "let me scan a lot quickly"   (one row each, dense)
 *   timeline — "when does all this happen?"  (grouped by month, chronological)
 */

import { useCallback, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, CalendarRange, Filter, LayoutGrid, List, Sparkles, X } from "lucide-react";

import { FEATURES, MASCOT, SITE } from "@/config/site";
import { INTERESTS_BY_ID, programMatchesTrack } from "@/data/taxonomy";
import { formatMonthYear } from "@/lib/dates";
import { downloadIcs } from "@/lib/ics";
import { rankPrograms } from "@/lib/match";
import {
  byUrgency,
  nextDateOf,
  normalizeAll,
  PHASE_LABELS,
  type NormalizedProgram,
} from "@/lib/program-schema";
import { cn } from "@/lib/utils";
import { useNow } from "@/state/now";
import { useOnboarding } from "@/state/onboarding";
import { ProgramCard } from "@/components/ProgramCard";
import { PhaseBadge } from "@/components/lifecycle/PhaseBadge";
import { SearchField } from "@/components/explore/SearchField";
import {
  DEFAULT_FILTERS,
  FilterRail,
  activeFilterCount,
  type ExploreFilters,
  type FacetCounts,
} from "@/components/explore/FilterRail";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/* -------------------------------------------------------------------------- */
/*  URL search params                                                          */
/* -------------------------------------------------------------------------- */

export interface ExploreSearch {
  q?: string;
  cat?: string[];
  track?: string;
  grade?: number;
  cost?: string;
  delivery?: string;
  commitment?: string;
  phase?: string;
  saved?: boolean;
  sort?: string;
  view?: string;
}

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.length > 0 ? v : undefined;

function validateSearch(search: Record<string, unknown>): ExploreSearch {
  const out: ExploreSearch = {};
  const q = str(search["q"]);
  if (q) out.q = q;

  const cat = search["cat"];
  if (Array.isArray(cat)) {
    const list = cat.filter((c): c is string => typeof c === "string");
    if (list.length > 0) out.cat = list;
  } else if (typeof cat === "string" && cat.length > 0) {
    out.cat = cat.split(",");
  }

  const track = str(search["track"]);
  if (track && INTERESTS_BY_ID.has(track)) out.track = track;

  const grade = Number(search["grade"]);
  if (Number.isInteger(grade) && SITE.grades.includes(grade as 9 | 10 | 11 | 12)) out.grade = grade;

  for (const key of ["cost", "delivery", "commitment", "phase", "sort", "view"] as const) {
    const v = str(search[key]);
    if (v) out[key] = v;
  }
  if (search["saved"] === true || search["saved"] === "true") out.saved = true;
  return out;
}

function toFilters(s: ExploreSearch): ExploreFilters {
  return {
    q: s.q ?? DEFAULT_FILTERS.q,
    categories: s.cat ?? DEFAULT_FILTERS.categories,
    track: s.track ?? DEFAULT_FILTERS.track,
    grade: typeof s.grade === "number" ? s.grade : null,
    cost: s.cost ?? DEFAULT_FILTERS.cost,
    delivery: s.delivery ?? DEFAULT_FILTERS.delivery,
    commitment: s.commitment ?? DEFAULT_FILTERS.commitment,
    phase: s.phase ?? DEFAULT_FILTERS.phase,
    savedOnly: s.saved ?? DEFAULT_FILTERS.savedOnly,
    sort: s.sort ?? DEFAULT_FILTERS.sort,
    view: s.view ?? DEFAULT_FILTERS.view,
  };
}

/** Only non-default values go in the URL, so shared links stay readable. */
function toSearch(f: ExploreFilters): ExploreSearch {
  const s: ExploreSearch = {};
  if (f.q.trim()) s.q = f.q.trim();
  if (f.categories.length > 0) s.cat = f.categories;
  if (f.track) s.track = f.track;
  if (f.grade !== null) s.grade = f.grade;
  if (f.cost !== "any") s.cost = f.cost;
  if (f.delivery !== "any") s.delivery = f.delivery;
  if (f.commitment !== "any") s.commitment = f.commitment;
  if (f.phase !== "actionable") s.phase = f.phase;
  if (f.savedOnly) s.saved = true;
  if (f.sort !== "deadline") s.sort = f.sort;
  if (f.view !== "grid") s.view = f.view;
  return s;
}

/* -------------------------------------------------------------------------- */
/*  Filtering                                                                  */
/* -------------------------------------------------------------------------- */

type Facet =
  "q" | "cat" | "track" | "grade" | "cost" | "delivery" | "commitment" | "phase" | "saved";

/**
 * One predicate for everything, with the ability to *skip* one facet. Skipping
 * is what makes the counts beside each option correct: the count for "STEM" is
 * how many results you would get with STEM applied and every other filter left
 * exactly as it is.
 */
function passes(
  p: NormalizedProgram,
  f: ExploreFilters,
  savedIds: string[],
  skip?: Facet,
): boolean {
  if (skip !== "q" && f.q.trim()) {
    const terms = f.q.trim().toLowerCase().split(/\s+/);
    if (!terms.every((t) => p.haystack.includes(t))) return false;
  }
  if (skip !== "cat" && f.categories.length > 0 && !f.categories.includes(p.category)) return false;
  if (skip !== "track" && f.track) {
    const track = INTERESTS_BY_ID.get(f.track);
    if (track && !programMatchesTrack(track, p.category, p.haystack)) return false;
  }
  if (skip !== "grade" && f.grade !== null && !p.grades.includes(f.grade)) return false;
  if (skip !== "cost" && f.cost !== "any" && p.costTier !== f.cost) return false;
  if (skip !== "delivery" && f.delivery !== "any" && p.delivery !== f.delivery) return false;
  if (skip !== "commitment" && f.commitment !== "any" && p.commitment !== f.commitment)
    return false;
  if (skip !== "phase") {
    if (f.phase === "actionable" && (p.phase === "closed" || p.phase === "in-session"))
      return false;
    if (f.phase !== "actionable" && f.phase !== "any" && p.phase !== f.phase) return false;
  }
  if (skip !== "saved" && f.savedOnly && !savedIds.includes(p.id)) return false;
  return true;
}

/* -------------------------------------------------------------------------- */
/*  Route                                                                      */
/* -------------------------------------------------------------------------- */

const TITLE = `Explore every opportunity — ${SITE.name}`;
const DESCRIPTION = `Filter ${SITE.region} student programs, competitions, scholarships and paid positions by track, grade, cost, format and application status.`;

export const Route = createFileRoute("/explore")({
  validateSearch,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Explore,
});

const VIEWS = [
  { id: "grid", label: "Grid", icon: LayoutGrid },
  { id: "list", label: "List", icon: List },
  { id: "timeline", label: "Timeline", icon: CalendarRange },
] as const;

function Explore() {
  const navigate = useNavigate({ from: "/explore" });
  const search = Route.useSearch();
  const now = useNow();
  const { saved, isSaved, toggleSaved, hydrated, profile, personalised, openQuiz } =
    useOnboarding();
  const [sheetOpen, setSheetOpen] = useState(false);

  const filters = useMemo(() => toFilters(search), [search]);
  const all = useMemo(() => normalizeAll(now), [now]);

  const setFilters = useCallback(
    (patch: Partial<ExploreFilters>) => {
      void navigate({ search: toSearch({ ...filters, ...patch }), replace: true });
    },
    [filters, navigate],
  );

  const clearFilters = useCallback(() => {
    void navigate({ search: filters.view === "grid" ? {} : { view: filters.view }, replace: true });
  }, [navigate, filters.view]);

  const results = useMemo(() => {
    const matched = all.filter((p) => passes(p, filters, saved));
    if (filters.sort === "title")
      return [...matched].sort((a, b) => a.title.localeCompare(b.title));
    if (filters.sort === "match" && personalised) {
      const order = new Map(rankPrograms(matched, profile).map((r, i) => [r.program.id, i]));
      return [...matched].sort((a, b) => (order.get(a.id) ?? 1e9) - (order.get(b.id) ?? 1e9));
    }
    return [...matched].sort(byUrgency);
  }, [all, filters, saved, personalised, profile]);

  const reasonsById = useMemo(() => {
    if (!personalised) return new Map<string, string[]>();
    return new Map(rankPrograms(all, profile).map((r) => [r.program.id, r.reasons]));
  }, [all, profile, personalised]);

  const counts = useMemo<FacetCounts>(() => {
    const countIn = (skip: Facet, pred: (p: NormalizedProgram) => boolean) =>
      all.filter((p) => passes(p, filters, saved, skip) && pred(p)).length;

    const categories: Record<string, number> = {};
    for (const c of new Set(all.map((p) => p.category))) {
      categories[c] = countIn("cat", (p) => p.category === c);
    }
    const tracks: Record<string, number> = {};
    for (const [id, t] of INTERESTS_BY_ID) {
      tracks[id] = countIn("track", (p) => programMatchesTrack(t, p.category, p.haystack));
    }
    const grades: Record<number, number> = {};
    for (const g of SITE.grades) grades[g] = countIn("grade", (p) => p.grades.includes(g));
    const cost: Record<string, number> = {};
    for (const t of ["free", "earns", "aid", "paid", "unknown"]) {
      cost[t] = countIn("cost", (p) => p.costTier === t);
    }
    const delivery: Record<string, number> = {};
    for (const d of ["in-person", "online", "hybrid", "unknown"]) {
      delivery[d] = countIn("delivery", (p) => p.delivery === d);
    }
    const commitment: Record<string, number> = {};
    for (const c of ["light", "medium", "intensive", "unknown"]) {
      commitment[c] = countIn("commitment", (p) => p.commitment === c);
    }
    const phase: Record<string, number> = {};
    for (const ph of ["open", "opening-soon", "in-session", "rolling", "closed"]) {
      phase[ph] = countIn("phase", (p) => p.phase === ph);
    }
    return { categories, tracks, grades, cost, delivery, commitment, phase };
  }, [all, filters, saved]);

  /** Timeline view: group by the month of whatever date comes next. */
  const months = useMemo(() => {
    if (filters.view !== "timeline") return [];
    const buckets = new Map<string, { label: string; items: NormalizedProgram[] }>();
    const undated: NormalizedProgram[] = [];
    for (const p of results) {
      const date = nextDateOf(p);
      if (!date) {
        undated.push(p);
        continue;
      }
      const key = date.slice(0, 7);
      const bucket = buckets.get(key);
      if (bucket) bucket.items.push(p);
      else buckets.set(key, { label: formatMonthYear(date), items: [p] });
    }
    const sorted = [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return [
      ...sorted.map(([key, v]) => ({ key, ...v })),
      ...(undated.length ? [{ key: "undated", label: "No fixed date", items: undated }] : []),
    ];
  }, [results, filters.view]);

  const active = activeFilterCount(filters);
  const savedWithDates = results.filter((p) => isSaved(p.id) && p.deadline);
  const trackLabel = filters.track ? INTERESTS_BY_ID.get(filters.track)?.label : null;

  const rail = (
    <FilterRail
      filters={filters}
      onChange={setFilters}
      onClear={clearFilters}
      counts={counts}
      savedCount={hydrated ? saved.length : 0}
    />
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="max-w-2xl">
        <p className="kicker">The catalogue</p>
        <h1 className="mt-1.5 font-display text-3xl leading-tight font-bold text-balance sm:text-4xl">
          {trackLabel
            ? `${trackLabel}, filtered down.`
            : "Every opportunity, filtered down to the ones you can actually get."}
        </h1>
        <p className="mt-3 text-base text-foreground/75">
          {all.length} listings. Use the facets to cut it to the handful worth your evening.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1 basis-72">
          <SearchField value={filters.q} onChange={(q) => setFilters({ q })} programs={all} />
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="sticker tap inline-flex items-center gap-2 rounded-full bg-card px-4 text-sm font-bold active:sticker-press lg:hidden"
            >
              <Filter className="size-4" aria-hidden />
              Filters
              {active > 0 && (
                <span className="tabular rounded-full border-2 border-border bg-primary px-1.5 text-xs text-primary-foreground">
                  {active}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(22rem,90vw)] overflow-y-auto border-r-2 p-5">
            <SheetTitle className="sr-only">Filters</SheetTitle>
            {rail}
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="sticker tap mt-6 w-full rounded-full bg-primary text-sm font-bold text-primary-foreground active:sticker-press"
            >
              Show {results.length} result{results.length === 1 ? "" : "s"}
            </button>
          </SheetContent>
        </Sheet>

        {/* ---- view toggle ---- */}
        <div
          className="sticker flex overflow-hidden rounded-full bg-card p-0.5"
          role="group"
          aria-label="Layout"
        >
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setFilters({ view: v.id })}
              aria-pressed={filters.view === v.id}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors",
                filters.view === v.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
              )}
            >
              <v.icon className="size-4" aria-hidden />
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>

        <label className="sr-only" htmlFor="sort">
          Sort results
        </label>
        <select
          id="sort"
          value={filters.sort}
          onChange={(e) => setFilters({ sort: e.target.value })}
          className="sticker tap rounded-full bg-card px-4 text-sm font-bold"
        >
          <option value="deadline">Soonest first</option>
          {personalised && <option value="match">Best match for me</option>}
          <option value="title">A – Z</option>
        </select>
      </div>

      {!personalised && hydrated && (
        <div className="sticker mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-accent/15 px-4 py-3">
          <Sparkles className="size-4 shrink-0 text-accent-foreground" aria-hidden />
          <p className="min-w-0 flex-1 text-sm font-medium">
            Answer four questions and {MASCOT.name} will rank all of this against your grade,
            interests and budget.
          </p>
          <button
            type="button"
            onClick={openQuiz}
            className="sticker tap rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground active:sticker-press"
          >
            Take the quiz
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[17.5rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticker sticky top-24 rounded-xl bg-surface p-5">{rail}</div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 border-b-2 border-rule pb-3">
            <p className="tabular text-sm font-bold">
              {results.length} result{results.length === 1 ? "" : "s"}
            </p>
            {active > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="tap inline-flex items-center gap-1.5 rounded-full px-2 text-sm font-bold text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden />
                Clear filters
              </button>
            )}
            {FEATURES.calendarExport && savedWithDates.length > 0 && (
              <button
                type="button"
                onClick={() => downloadIcs(savedWithDates, "my-deadlines.ics")}
                className="sticker tap ml-auto inline-flex items-center gap-2 rounded-full bg-card px-4 text-sm font-bold active:sticker-press"
              >
                <CalendarDays className="size-4" aria-hidden />
                Export {savedWithDates.length} saved
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="sticker mx-auto mt-10 max-w-md rounded-xl bg-card p-10 text-center">
              <h2 className="font-display text-xl font-bold">Nothing matches that yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The counts beside each filter show what is available — anything reading zero is
                greyed out. Try dropping the narrowest one.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="sticker tap mt-5 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground active:sticker-press"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={filters.view}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {filters.view === "grid" && (
                  <ul className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {results.map((p, i) => (
                      <li key={p.id} className="h-full">
                        <ProgramCard
                          program={p}
                          index={i}
                          saved={hydrated && isSaved(p.id)}
                          onToggleSave={toggleSaved}
                          onAddToCalendar={(prog) => downloadIcs([prog], `${prog.id}.ics`)}
                          reasons={reasonsById.get(p.id)}
                        />
                      </li>
                    ))}
                  </ul>
                )}

                {filters.view === "list" && (
                  <ul className="mt-5 grid gap-2.5">
                    {results.map((p) => (
                      <li key={p.id}>
                        <ProgramCard
                          program={p}
                          variant="compact"
                          saved={hydrated && isSaved(p.id)}
                          onToggleSave={toggleSaved}
                        />
                      </li>
                    ))}
                  </ul>
                )}

                {filters.view === "timeline" && (
                  <ol className="mt-6 grid gap-8">
                    {months.map((m) => (
                      <li key={m.key}>
                        <div className="flex items-center gap-3">
                          <h2 className="font-display text-xl font-bold">{m.label}</h2>
                          <span className="tabular kicker">{m.items.length}</span>
                          <span className="h-0.5 flex-1 bg-rule" aria-hidden />
                        </div>
                        <ul className="mt-3 grid gap-2.5">
                          {m.items.map((p) => (
                            <li
                              key={p.id}
                              className="sticker flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-card p-4"
                            >
                              <span className="tabular w-14 shrink-0 font-display text-sm font-bold text-muted-foreground">
                                {nextDateOf(p)?.slice(8, 10) ?? "--"}
                              </span>
                              <span className="min-w-0 flex-1 basis-48">
                                <a
                                  href={`/program/${p.id}`}
                                  className="text-sm font-bold hover:text-primary"
                                >
                                  {p.title}
                                </a>
                                <span className="block text-xs text-muted-foreground">
                                  {p.org} · {PHASE_LABELS[p.phase]}
                                </span>
                              </span>
                              <PhaseBadge program={p} showLabel={false} />
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ol>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
