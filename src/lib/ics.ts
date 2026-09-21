/**
 * Calendar export.
 *
 * Two routes out, because students split between two habits:
 *   - an `.ics` file, which every calendar app on every platform imports, and
 *     which carries a one-week-ahead alarm on each deadline;
 *   - a Google Calendar template link for a single event, for the many
 *     students who live in Google Calendar and will not download a file.
 *
 * There is no bulk Google link — the API does not offer one — so the honest
 * shape is: `.ics` for everything at once, a Google link per milestone.
 */

import { SITE } from "@/config/site";
import type { Program } from "@/data/programs";

function stamp(date: string) {
  return date.replace(/-/g, "");
}

function esc(text: string) {
  return text.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

/** The day after `date`, as a compact ICS date — ICS DTEND is exclusive. */
function nextDay(date: string) {
  return stamp(
    new Date(new Date(`${date}T12:00:00`).getTime() + 86_400_000).toISOString().slice(0, 10),
  );
}

export type EventKind = "opens" | "deadline" | "starts";

const TITLES: Record<EventKind, string> = {
  opens: "Applications open",
  deadline: "Deadline",
  starts: "Starts",
};

interface CalendarEvent {
  program: Program;
  kind: EventKind;
  date: string;
}

function event({ program, kind, date }: CalendarEvent) {
  const start = stamp(date);
  const summary = `${TITLES[kind]} — ${program.title}`;
  const note =
    kind === "deadline"
      ? program.confidence === "confirmed"
        ? "Verified deadline."
        : "Estimated deadline — verify on the official site."
      : `${TITLES[kind]} for ${program.title}.`;

  return [
    "BEGIN:VEVENT",
    `UID:${program.id}-${kind}@${SITE.shortName.toLowerCase()}`,
    `DTSTAMP:${start}T090000Z`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${nextDay(date)}`,
    `SUMMARY:${esc(summary)}`,
    `DESCRIPTION:${esc(`${note}\n${program.org}\n${program.summary}\n${program.url}`)}`,
    `URL:${program.url}`,
    "BEGIN:VALARM",
    "TRIGGER:-P7D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`One week until: ${summary}`)}`,
    "END:VALARM",
    "END:VEVENT",
  ].join("\r\n");
}

/** Every dated milestone a program carries. */
export function eventsFor(program: Program): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  if (program.appOpenDate) out.push({ program, kind: "opens", date: program.appOpenDate });
  if (program.deadline) out.push({ program, kind: "deadline", date: program.deadline });
  if (program.programStartDate)
    out.push({ program, kind: "starts", date: program.programStartDate });
  return out;
}

export function buildIcs(programs: Program[]): string {
  const body = programs.flatMap(eventsFor).map(event).join("\r\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${SITE.name}//EN`,
    "CALSCALE:GREGORIAN",
    body,
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadIcs(programs: Program[], filename: string) {
  const blob = new Blob([buildIcs(programs)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** A "add this one event" link for students who live in Google Calendar. */
export function googleCalendarUrl(program: Program, kind: EventKind, date: string): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${TITLES[kind]} — ${program.title}`,
    dates: `${stamp(date)}/${nextDay(date)}`,
    details: `${program.org}\n${program.summary}\n${program.url}`,
    location: program.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
