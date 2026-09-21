/**
 * Real-time search with keyboard-accessible autosuggestions.
 *
 * Built on the ARIA combobox pattern rather than a `<datalist>` so the
 * suggestions can carry an organisation name and a deadline badge — and so
 * they look like the rest of the site. Arrow keys move, Enter opens the
 * highlighted program, Escape closes, and Enter with nothing highlighted runs
 * a plain text search.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CornerDownLeft, Search, X } from "lucide-react";

import type { NormalizedProgram } from "@/lib/program-schema";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (next: string) => void;
  programs: NormalizedProgram[];
  placeholder?: string;
  /** Called on Enter when no suggestion is highlighted. */
  onSubmit?: (query: string) => void;
  className?: string;
  autoFocus?: boolean;
}

export function SearchField({
  value,
  onChange,
  programs,
  placeholder = "Search programs, organisations, keywords",
  onSubmit,
  className,
  autoFocus,
}: Props) {
  const navigate = useNavigate();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (q.length < 2) return [];
    return programs
      .filter((p) => p.title.toLowerCase().includes(q) || p.org.toLowerCase().includes(q))
      .slice(0, 6);
  }, [value, programs]);

  useEffect(() => setHighlight(-1), [value]);

  // Close when focus or a click leaves the combobox.
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const goTo = (program: NormalizedProgram) => {
    setOpen(false);
    void navigate({ to: "/program/$programId", params: { programId: program.id } });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (h + 1) % suggestions.length);
      return;
    }
    if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
      return;
    }
    if (e.key === "Enter") {
      const picked = suggestions[highlight];
      if (picked) {
        e.preventDefault();
        goTo(picked);
      } else {
        onSubmit?.(value);
        setOpen(false);
      }
    }
  };

  const expanded = open && suggestions.length > 0;

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={highlight >= 0 ? `${listId}-opt-${highlight}` : undefined}
        aria-label="Search opportunities"
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={cn(
          "tap w-full rounded-full border-2 border-border bg-card pr-11 pl-11 text-base",
          "placeholder:text-muted-foreground/80 focus:border-primary focus:outline-none",
          "transition-colors [&::-webkit-search-cancel-button]:hidden",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}

      {expanded && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          className="animate-pop absolute top-[calc(100%+0.5rem)] right-0 left-0 z-50 overflow-hidden rounded-2xl border border-rule bg-popover shadow-lift"
        >
          {suggestions.map((p, i) => (
            <li
              key={p.id}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === highlight}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                goTo(p);
              }}
              className={cn(
                "flex cursor-pointer items-center gap-3 border-b border-rule px-4 py-2.5 last:border-b-0",
                i === highlight && "bg-muted",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{p.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {p.org} · {p.category}
                </span>
              </span>
              <span className="shrink-0 text-xs font-bold text-muted-foreground tabular-nums">
                {p.urgencyLabel}
              </span>
              {i === highlight && (
                <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
