/**
 * Multi-facet filter rail.
 *
 * Router-agnostic on purpose: it takes a filter object and an onChange, so the
 * same component works whether a fork drives it from URL search params (as we
 * do) or from local state.
 *
 * Facet counts are passed in rather than computed here, so each option can
 * show how many results it would actually return — the single most useful
 * thing a filter UI can do to stop students walking into empty states. An
 * option that would return nothing is disabled rather than hidden, because
 * "zero robotics programs open right now" is itself information.
 */

import { RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

import { SITE } from "@/config/site";
import { CATEGORIES } from "@/data/programs";
import { INTERESTS } from "@/data/taxonomy";
import { CATEGORY_META } from "@/lib/category";
import {
  COMMITMENT_LABELS,
  COST_LABELS,
  DELIVERY_LABELS,
  PHASE_LABELS,
} from "@/lib/program-schema";
import { cn } from "@/lib/utils";

export interface ExploreFilters {
  q: string;
  categories: string[];
  /** A single interest track, which is narrower than a category. */
  track: string;
  grade: number | null;
  cost: string;
  delivery: string;
  commitment: string;
  /** Application lifecycle phase, or "any" / "actionable". */
  phase: string;
  savedOnly: boolean;
  sort: string;
  view: string;
}

export const DEFAULT_FILTERS: ExploreFilters = {
  q: "",
  categories: [],
  track: "",
  grade: null,
  cost: "any",
  delivery: "any",
  commitment: "any",
  phase: "actionable",
  savedOnly: false,
  sort: "deadline",
  view: "grid",
};

export function activeFilterCount(f: ExploreFilters): number {
  return (
    (f.q.trim() ? 1 : 0) +
    f.categories.length +
    (f.track ? 1 : 0) +
    (f.grade !== null ? 1 : 0) +
    (f.cost !== "any" ? 1 : 0) +
    (f.delivery !== "any" ? 1 : 0) +
    (f.commitment !== "any" ? 1 : 0) +
    (f.phase !== "actionable" ? 1 : 0) +
    (f.savedOnly ? 1 : 0)
  );
}

export interface FacetCounts {
  categories: Record<string, number>;
  tracks: Record<string, number>;
  grades: Record<number, number>;
  cost: Record<string, number>;
  delivery: Record<string, number>;
  commitment: Record<string, number>;
  phase: Record<string, number>;
}

interface Props {
  filters: ExploreFilters;
  onChange: (patch: Partial<ExploreFilters>) => void;
  onClear: () => void;
  counts: FacetCounts;
  savedCount: number;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t-2 border-rule py-4 first:border-t-0 first:pt-0">
      <legend className="kicker mb-2.5">{title}</legend>
      {children}
    </fieldset>
  );
}

function Pill({
  active,
  onClick,
  children,
  count,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
  tone?: string;
}) {
  const empty = count === 0;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={empty && !active}
      whileTap={empty && !active ? {} : { y: 2 }}
      className={cn(
        "sticker inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold",
        "active:sticker-press disabled:cursor-not-allowed disabled:opacity-40",
        active ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary",
        active && tone,
      )}
    >
      {children}
      {typeof count === "number" && (
        <span
          className={cn("tabular", active ? "text-primary-foreground/70" : "text-muted-foreground")}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
}

export function FilterRail({ filters, onChange, onClear, counts, savedCount }: Props) {
  const toggleCategory = (c: string) =>
    onChange({
      categories: filters.categories.includes(c)
        ? filters.categories.filter((x) => x !== c)
        : [...filters.categories, c],
    });

  const active = activeFilterCount(filters);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 pb-3">
        <h2 className="font-display text-lg font-bold">Filters</h2>
        {active > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="tap inline-flex items-center gap-1.5 rounded-full px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset ({active})
          </button>
        )}
      </div>

      <Section title="Application status">
        <div className="flex flex-wrap gap-2">
          <Pill
            active={filters.phase === "actionable"}
            onClick={() => onChange({ phase: "actionable" })}
          >
            Anything I can act on
          </Pill>
          {(["open", "opening-soon", "in-session", "rolling", "closed"] as const).map((ph) => (
            <Pill
              key={ph}
              active={filters.phase === ph}
              onClick={() => onChange({ phase: filters.phase === ph ? "actionable" : ph })}
              count={counts.phase[ph] ?? 0}
            >
              {PHASE_LABELS[ph]}
            </Pill>
          ))}
          <Pill active={filters.phase === "any"} onClick={() => onChange({ phase: "any" })}>
            Show everything
          </Pill>
        </div>
      </Section>

      <Section title="Track">
        <div className="flex flex-wrap gap-2">
          <Pill active={filters.track === ""} onClick={() => onChange({ track: "" })}>
            Any
          </Pill>
          {INTERESTS.map((t) => (
            <Pill
              key={t.id}
              active={filters.track === t.id}
              onClick={() => onChange({ track: filters.track === t.id ? "" : t.id })}
              count={counts.tracks[t.id] ?? 0}
            >
              <span aria-hidden className="font-display">
                {t.glyph}
              </span>
              {t.label}
            </Pill>
          ))}
        </div>
      </Section>

      <Section title="Subject">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_META[c].icon;
            return (
              <Pill
                key={c}
                active={filters.categories.includes(c)}
                onClick={() => toggleCategory(c)}
                count={counts.categories[c] ?? 0}
              >
                <Icon className="size-3.5" aria-hidden />
                {c}
              </Pill>
            );
          })}
        </div>
      </Section>

      <Section title="Grade level">
        <div className="flex flex-wrap gap-2">
          <Pill active={filters.grade === null} onClick={() => onChange({ grade: null })}>
            Any
          </Pill>
          {SITE.grades.map((g) => (
            <Pill
              key={g}
              active={filters.grade === g}
              onClick={() => onChange({ grade: filters.grade === g ? null : g })}
              count={counts.grades[g] ?? 0}
            >
              Grade {g}
            </Pill>
          ))}
        </div>
      </Section>

      <Section title="Cost">
        <div className="flex flex-wrap gap-2">
          <Pill active={filters.cost === "any"} onClick={() => onChange({ cost: "any" })}>
            Any
          </Pill>
          {(["free", "earns", "aid", "paid"] as const).map((tier) => (
            <Pill
              key={tier}
              active={filters.cost === tier}
              onClick={() => onChange({ cost: filters.cost === tier ? "any" : tier })}
              count={counts.cost[tier] ?? 0}
            >
              {COST_LABELS[tier]}
            </Pill>
          ))}
        </div>
      </Section>

      <Section title="Remote or in person">
        <div className="flex flex-wrap gap-2">
          <Pill active={filters.delivery === "any"} onClick={() => onChange({ delivery: "any" })}>
            Any
          </Pill>
          {(["in-person", "online", "hybrid"] as const).map((d) => (
            <Pill
              key={d}
              active={filters.delivery === d}
              onClick={() => onChange({ delivery: filters.delivery === d ? "any" : d })}
              count={counts.delivery[d] ?? 0}
            >
              {DELIVERY_LABELS[d]}
            </Pill>
          ))}
        </div>
      </Section>

      <Section title="Time commitment">
        <div className="flex flex-wrap gap-2">
          <Pill
            active={filters.commitment === "any"}
            onClick={() => onChange({ commitment: "any" })}
          >
            Any
          </Pill>
          {(["light", "medium", "intensive"] as const).map((c) => (
            <Pill
              key={c}
              active={filters.commitment === c}
              onClick={() => onChange({ commitment: filters.commitment === c ? "any" : c })}
              count={counts.commitment[c] ?? 0}
            >
              {COMMITMENT_LABELS[c]}
            </Pill>
          ))}
        </div>
      </Section>

      <Section title="My list">
        <Pill
          active={filters.savedOnly}
          onClick={() => onChange({ savedOnly: !filters.savedOnly })}
          count={savedCount}
        >
          Saved to my roadmap
        </Pill>
      </Section>
    </div>
  );
}
