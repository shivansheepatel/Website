/**
 * Date formatting.
 *
 * Every ISO date is parsed at noon so a timezone shift can never move it to
 * the previous or next day on the display side. (Day *arithmetic* is a
 * different problem, handled in UTC — see `daysUntil` in data/programs.ts.)
 */

const at = (iso: string) => new Date(`${iso}T12:00:00`);

export function formatDate(iso: string | null, fallback = "Not published"): string {
  if (!iso) return fallback;
  return at(iso).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });
}

export function formatShort(iso: string | null): string {
  if (!iso) return "—";
  return at(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export function formatMonth(iso: string | null): string {
  if (!iso) return "—";
  return at(iso).toLocaleDateString("en-CA", { month: "long" });
}

export function formatMonthYear(iso: string | null): string {
  if (!iso) return "—";
  return at(iso).toLocaleDateString("en-CA", { month: "short", year: "numeric" });
}

/** "July 10 – August 5" — or a single date when the end is unknown. */
export function formatRange(start: string | null, end: string | null): string {
  if (!start) return "Dates not published";
  if (!end) return `From ${formatDate(start)}`;
  const a = at(start);
  const b = at(end);
  const sameYear = a.getFullYear() === b.getFullYear();
  const sameMonth = sameYear && a.getMonth() === b.getMonth();
  if (sameMonth) {
    return `${a.toLocaleDateString("en-CA", { month: "long", day: "numeric" })} – ${b.getDate()}, ${b.getFullYear()}`;
  }
  if (sameYear) {
    return `${a.toLocaleDateString("en-CA", { month: "long", day: "numeric" })} – ${b.toLocaleDateString("en-CA", { month: "long", day: "numeric" })}, ${b.getFullYear()}`;
  }
  return `${formatDate(start)} – ${formatDate(end)}`;
}

/** The month a recurring deadline tends to fall in — used on closed cards. */
export function usualMonth(iso: string | null): string | null {
  if (!iso) return null;
  return at(iso).toLocaleDateString("en-CA", { month: "long" });
}
