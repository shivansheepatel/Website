/**
 * Reading and writing `src/data/programs.ts` as data.
 *
 * The catalogue is hand-authored TypeScript, and that is a feature: it
 * diffs beautifully in a pull request, it needs no database to render, and a
 * counsellor can read the review in GitHub without an account on anything.
 * The cost is that this module has to edit source code rather than rows.
 *
 * It does so with a small brace-aware scanner rather than a regex over the
 * whole file, and with a hard rule: it only ever replaces a single `field:`
 * line inside one entry's span, or appends a whole new entry before the
 * closing bracket. It never reformats, never reorders, and never rewrites an
 * entry wholesale. If a surgical edit cannot be made cleanly, the change is
 * demoted to the review queue with a note instead of being forced through.
 */
import { readFile, writeFile } from "node:fs/promises";

export const PROGRAMS_PATH = "src/data/programs.ts";

export interface EntrySpan {
  id: string;
  /** Index of the opening `{` of this entry in the file. */
  start: number;
  /** Index just past the matching `}`. */
  end: number;
  source: string;
}

/** Walk the file, brace-counting, skipping strings/template literals/comments. */
export function scanEntries(src: string): EntrySpan[] {
  // Anchor on the assignment, not on the identifier: `PROGRAMS: Program[] = [`
  // contains a `[` in its *type* that is not the array we want.
  const decl = /\bPROGRAMS\b[^=\n]*=\s*\[/.exec(src);
  if (!decl) throw new Error("could not find the PROGRAMS array literal");
  const bracket = decl.index + decl[0].length - 1;

  const spans: EntrySpan[] = [];
  let i = bracket + 1;
  let depth = 0;
  let entryStart = -1;

  while (i < src.length) {
    const ch = src[i]!;
    const two = src.slice(i, i + 2);

    if (two === "//") {
      i = src.indexOf("\n", i);
      if (i < 0) break;
      continue;
    }
    if (two === "/*") {
      i = src.indexOf("*/", i) + 2;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i++;
      while (i < src.length) {
        if (src[i] === "\\") {
          i += 2;
          continue;
        }
        if (src[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    if (ch === "{") {
      if (depth === 0) entryStart = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && entryStart >= 0) {
        const source = src.slice(entryStart, i + 1);
        const m = /\bid:\s*["'`]([^"'`]+)["'`]/.exec(source);
        if (m) spans.push({ id: m[1]!, start: entryStart, end: i + 1, source });
        entryStart = -1;
      }
    } else if (ch === "]" && depth === 0) {
      return spans;
    }
    i++;
  }
  return spans;
}

const TS_STRING = (s: string) =>
  '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ").trim() + '"';

function renderValue(v: unknown): string {
  if (v === null) return "null";
  if (typeof v === "string") return TS_STRING(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return "[" + v.map(renderValue).join(", ") + "]";
  return JSON.stringify(v);
}

/**
 * Replace one `field: value,` inside one entry. Returns null when the field is
 * not present as a simple single-line property — the caller then queues it for
 * a human rather than guessing at multi-line structures.
 */
export function replaceField(
  src: string,
  span: EntrySpan,
  field: string,
  value: unknown,
): string | null {
  const entry = src.slice(span.start, span.end);
  const rx = new RegExp(`(\\n\\s*${field}:\\s*)([^\\n]*?)(,?)(?=\\n)`);
  const m = rx.exec(entry);
  if (!m) {
    // Field absent: insert it just before the closing brace of the entry.
    const insertAt = entry.lastIndexOf("}");
    if (insertAt < 0) return null;
    const indent = /\n(\s+)\w+:/.exec(entry)?.[1] ?? "  ";
    const patched =
      entry.slice(0, insertAt).replace(/\s*$/, "") +
      `,\n${indent}${field}: ${renderValue(value)},\n` +
      entry.slice(insertAt);
    return src.slice(0, span.start) + patched + src.slice(span.end);
  }
  if (/[[{`]/.test(m[2]!)) return null; // multi-line or nested — don't touch
  const patched =
    entry.slice(0, m.index) + m[1] + renderValue(value) + "," + entry.slice(m.index + m[0].length);
  return src.slice(0, span.start) + patched + src.slice(span.end);
}

/** Render a brand-new entry as TypeScript source. Field order matches the file's. */
export function renderEntry(p: Record<string, unknown>): string {
  const order = [
    "id",
    "title",
    "org",
    "category",
    "grades",
    "cost",
    "format",
    "location",
    "deadline",
    "appOpenDate",
    "programStartDate",
    "programEndDate",
    "confidence",
    "checked",
    "url",
    "sourceUrl",
    "summary",
    "eligibility",
    "commitment",
    "why",
  ];
  const lines: string[] = ["  {"];
  for (const key of order) {
    if (!(key in p) || p[key] === undefined) continue;
    lines.push(`    ${key}: ${renderValue(p[key])},`);
  }
  for (const key of Object.keys(p)) {
    if (order.includes(key) || p[key] === undefined) continue;
    lines.push(`    ${key}: ${renderValue(p[key])},`);
  }
  lines.push("  },");
  return lines.join("\n");
}

/** Append entries immediately before the array's closing `];`. */
export function appendEntries(src: string, entries: string[]): string {
  if (!entries.length) return src;
  const spans = scanEntries(src);
  const last = spans.at(-1);
  const decl = /\bPROGRAMS\b[^=\n]*=\s*\[/.exec(src);
  const anchor = src.indexOf("]", last ? last.end : decl ? decl.index + decl[0].length : 0);
  if (anchor < 0) throw new Error("could not find the end of the PROGRAMS array");
  const block =
    "\n  // --- added by the data engine; review the diff before merging ---\n" +
    entries.join("\n") +
    "\n";
  return src.slice(0, anchor) + block + src.slice(anchor);
}

export async function readCatalogSource(path = PROGRAMS_PATH): Promise<string> {
  return readFile(path, "utf8");
}

export async function writeCatalogSource(src: string, path = PROGRAMS_PATH): Promise<void> {
  await writeFile(path, src);
}

/** Slugged id that will not collide with anything already in the file. */
export function mintId(title: string, org: string, taken: Set<string>): string {
  const base =
    (title + "-" + org)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .split("-")
      .slice(0, 6)
      .join("-") || "program";
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}
