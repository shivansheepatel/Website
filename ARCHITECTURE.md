# Architecture

How this codebase is put together, and why. Read `docs/DATA-PIPELINE.md`
alongside it for the freshness story, and `FORKING.md` to stand up your own
instance.

---

## Folder blueprint

```
apptrack-web/
├── .github/workflows/
│   ├── ci.yml                  Typecheck → lint → engine + data checks → build
│   └── freshness.yml           Daily link/date check → rolling GitHub issue
│
├── docs/DATA-PIPELINE.md       How the data is kept true, and how to scale it
│
├── scripts/
│   ├── check-engine.mts        Assertions over lifecycle, scoring and roadmap
│   ├── check-freshness.mjs     Probes URLs; flags expired, stale, missing dates
│   ├── generate-routes.mjs     Regenerates routeTree.gen.ts without a build
│   ├── alias-loader.mjs        Teaches plain Node the `@/…` path alias
│   └── register-alias.mjs      `--import` shim for the loader above
│
├── public/                     favicon, robots.txt — served as-is
│
└── src/
    ├── config/site.ts          ◀ THE ONLY FILE A FORK MUST EDIT
    │                             Identity, mascot, hero copy, feature flags,
    │                             lifecycle thresholds, prep steps, badges.
    │
    ├── styles.css              ◀ THE THEME. Eight colour anchors, two fonts,
    │                             arcade utilities, keyframes, print layout.
    │
    ├── data/                   Content. No React, no side effects.
    │   ├── programs.ts           129 listings + the authored Program type
    │   ├── taxonomy.ts           Interest tracks, skill goals, budget, time
    │   └── resources.ts          Checklists and articles for /counselors
    │
    ├── lib/                    Pure logic — testable without a DOM, SSR-safe.
    │   ├── program-schema.ts     THE LIFECYCLE ENGINE. getProgramStatus(),
    │   │                         getTimeRemaining(), normalize(), classifiers
    │   ├── match.ts              Scoring: profile + catalogue → ranked matches
    │   │                         with plain-language reasons
    │   ├── roadmap.ts            Ranked matches → dated milestones by term
    │   ├── dialogue.ts           Every line Byte says, in one place
    │   ├── badges.ts             Badge progress from real counters
    │   ├── dates.ts              Formatting (noon-anchored, timezone-safe)
    │   ├── ics.ts                .ics export + Google Calendar links
    │   └── category.ts, utils.ts
    │
    ├── state/                  React context. Client concerns only.
    │   ├── onboarding.tsx        Quiz answers, saved list, prep checklists,
    │   │                         submissions, cohort alerts → localStorage
    │   └── now.tsx               A shared, hydration-safe clock
    │
    ├── components/
    │   ├── ui/                   shadcn/ui primitives (45) — generated
    │   ├── mascot/
    │   │   ├── Byte.tsx            SVG sprite, six expressions, no image asset
    │   │   └── SpeechBubble.tsx    Typewriter reveal, a11y-safe
    │   ├── onboarding/
    │   │   └── OnboardingQuiz.tsx  Four steps, skip on every one
    │   ├── lifecycle/
    │   │   ├── PhaseBadge.tsx      Phase pill, verification chip, unknown-date
    │   │   ├── Countdown.tsx       Live ticking countdown, SSR-safe
    │   │   └── PrepChecklist.tsx   The preparation workspace
    │   ├── explore/
    │   │   ├── SearchField.tsx     ARIA combobox with autosuggestions
    │   │   └── FilterRail.tsx      Multi-facet filters with live counts
    │   ├── motion/
    │   │   ├── PageTransition.tsx  Route transitions
    │   │   └── RetroLoader.tsx     Striped indeterminate loading bar
    │   ├── layout/SiteHeader.tsx
    │   ├── ProgramCard.tsx       One component, five lifecycle layouts
    │   ├── AboutDialog.tsx, ReportDialog.tsx, SiteFooter.tsx
    │
    ├── routes/                 File-based routing (TanStack Router)
    │   ├── __root.tsx            Shell: head, providers, chrome, transitions
    │   ├── index.tsx             /                  Hero, ticker, tracks
    │   ├── explore.tsx           /explore           Facets + 3 view modes
    │   ├── program.$programId.tsx /program/:id      Lifecycle header + prep
    │   ├── roadmap.tsx           /roadmap           Milestones by term
    │   ├── dashboard.tsx         /dashboard         Progress and badges
    │   └── counselors.tsx        /counselors        Share links, batch lists
    │
    ├── routeTree.gen.ts        Generated. Never edit by hand.
    ├── router.tsx              Router instance + query client
    ├── server.ts / start.ts    SSR entry points
    └── styles.css
```

### Routing table

| File                            | URL                   | Notes                                      |
| ------------------------------- | --------------------- | ------------------------------------------ |
| `routes/index.tsx`              | `/`                   |                                            |
| `routes/explore.tsx`            | `/explore`            | All filter and view state in search params |
| `routes/program.$programId.tsx` | `/program/:programId` | 404s via `notFound()` in the loader        |
| `routes/roadmap.tsx`            | `/roadmap`            | `noindex` — it is personal                 |
| `routes/dashboard.tsx`          | `/dashboard`          | `noindex`                                  |
| `routes/counselors.tsx`         | `/counselors`         |                                            |

TanStack Router uses **file-based** routing. A new file under `src/routes/`
becomes a route; `routeTree.gen.ts` regenerates on `npm run dev` or
`npm run routes:generate`. Do not create `src/pages/` or `app/layout.tsx` —
those are Next.js conventions and do nothing here.

---

## The application lifecycle engine

The centre of the system. `getProgramStatus(program, now)` in
`src/lib/program-schema.ts` returns one of five phases, and the UI reshapes
itself around the answer.

```
                        ┌─ running right now? ──────► in-session
                        │   (start ≤ now ≤ end)
  getProgramStatus() ───┼─ open date in the future? ► opening-soon
                        │
                        ├─ deadline in the future? ─► open  (+ urgency)
                        ├─ deadline passed? ────────► closed
                        └─ no dates at all? ────────► rolling
```

Two decisions in that order are worth calling out:

**Running beats closed.** Inside the run window the deadline has necessarily
passed, and "Closed" is a useless thing to tell a student looking at a program
happening this week. They get the run dates and a next-cohort reminder.

**A future open date beats a passed deadline.** That is next cycle, and
"Opening soon" is precisely the state where a student still has time to line
up references and draft answers — the most useful warning the site can give.

Urgency (`none` / `approaching` / `closing-soon`) is a _modifier_ on the open
phase, never a phase of its own, so the layout switch stays five-way and the
countdown colour is a separate decision.

### Honest degradation

Most organisers publish a closing date and nothing else. Every date field
beyond `deadline` is optional, and absent means **unknown**, never false:

| Data present                 | What the student sees                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| deadline only                | "Applications open · 42 days left", with "open date not published by the organiser" |
| + `appOpenDate` in future    | The Opening-soon layout, with a real countdown to opening                           |
| + `programStartDate/EndDate` | The In-session layout, with real run dates                                          |
| nothing                      | "Rolling intake — apply whenever you are ready"                                     |

`normalize()` exposes `missingDates`, the daily sync job reports coverage, and
nothing anywhere estimates a date. A fabricated open date sends a student to a
form that does not exist yet, which is worse than saying nothing.

---

## The data flow

```
  data/programs.ts          authored, terse, human-editable
         │                  { deadline: "2026-11-25", confidence: "confirmed" }
         ▼
  lib/program-schema.ts     normalize(p, now) — computed EVERY render
         │                  { phase: "open", urgency: "closing-soon",
         │                    daysRemaining: 3, costTier: "aid", … }
         ▼
  lib/match.ts              scoreProgram(p, profile) → { score, reasons[] }
         ▼
  lib/roadmap.ts            milestonesFor() → dated marks, bucketed by term
         ▼
  components + routes       render
```

Each layer knows only about the one above it. Swap `programs.ts` for a database
call and nothing downstream changes, because everything is typed against the
`Program` interface.

**Nothing is cached.** `normalizeAll(now)` runs inside a `useMemo` keyed on the
clock, never at module scope. A module-level constant would freeze every
countdown at build time — the exact bug this architecture exists to prevent.

---

## Design system — "modern arcade"

A cabinet in a warm room, not a neon strip at midnight. Tokens live at the top
of `src/styles.css`; eight anchors drive everything:

```css
--arcade-paper: #faf8f5; /* warm off-white ground                    */
--arcade-ink: #241f1b; /* warm near-black — type, borders, shadows */
--arcade-cobalt: #2b50c8; /* primary action                           */
--arcade-mustard: #f0a520; /* highlight, accents                       */
--arcade-tomato: #d94b30; /* urgency only — never decoration          */
--arcade-pine: #2c7a5a; /* verified, success                        */
--arcade-grape: #6a4bc4; /* equity flags                             */
--arcade-cyan: #128ba3; /* Byte                                     */
```

**The tactile signature** is a hard offset shadow — `3px 3px 0 var(--ink)` —
plus a 2px ink outline, applied through the `sticker` utility. Buttons and
cards read as keycaps or stickers, and press _in_ on `:active`
(`sticker-press`). No blurred drop shadows, no glass, no gradient surfaces.

**Typography**: Space Grotesk for display and numbers (its tabular figures
carry the countdowns), Plus Jakarta Sans for body.

### Custom utilities

`kicker` · `sticker` / `sticker-hover` / `sticker-press` · `pixel-corner`
(8-bit chamfers via clip-path) · `cabinet-wash` (halftone dots, not a gradient)
· `caution` (diagonal stripes, urgent things only) · `tap` (44px minimum) ·
`ticker-track` · `stripes` · `stagger`.

### Motion

Framer Motion, used in five places and no more:

| Where             | What                                                  |
| ----------------- | ----------------------------------------------------- |
| `PageTransition`  | 220ms fade-and-lift between routes, keyed on pathname |
| Buttons and tiles | Spring `whileTap` press, `whileHover` lift            |
| `ProgramCard`     | Hover lift with a 0.35° tilt                          |
| Quiz steps        | Directional slide via `AnimatePresence mode="wait"`   |
| `RetroLoader`     | Indeterminate striped bar, never a fake percentage    |

`useReducedMotion()` is checked in every animated component, and the CSS kills
all animation under `prefers-reduced-motion`.

### Deliberate non-choices

No purple→cyan gradients. No glassmorphism. Dark mode is opt-in, not default.
No glow or bloom. No stock 3D illustrations — the only decoration is a halftone
wash and a hand-drawn SVG mascot.

---

## Byte

A hand-drawn SVG sprite in `components/mascot/Byte.tsx`, not an image asset: it
inherits theme colours, scales without a second file, and costs nothing to
ship. Six expressions, each swapping the eye and mouth paths.

Every line lives in `lib/dialogue.ts`, so the character's voice can be
rewritten, translated or toned down without touching a component. Two writing
rules: react to what the student _actually said_ (a response that fits any
answer tells them nobody is listening), and never oversell.

`MASCOT.enabled: false` in config strips the character out entirely and the
quiz falls back to plain headings — the right call for a counsellor-facing
deployment.

---

## State

| Concern                                                               | Where                           | Persistence                                       |
| --------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------- |
| Quiz answers, saved list, prep checklists, submissions, cohort alerts | `state/onboarding.tsx`          | `localStorage`, key from config                   |
| Current time                                                          | `state/now.tsx`                 | none — seeded from the server, ticks every 30 min |
| Filters, sort and view mode                                           | URL search params on `/explore` | the URL                                           |
| Server data                                                           | TanStack Query client           | unused today; wired for a future API              |

No Zustand, no Redux. There are two pieces of shared client state and one of
them is a clock — context is the right size, and it is one less dependency for
a school to audit.

### SSR notes

This app server-renders, which creates two traps that are already handled:

1. **`localStorage` does not exist on the server.** Every read happens in an
   effect; `hydrated` gates anything personalised.
2. **The server clock is UTC and the student's is not.** `useNow()` seeds the
   first client render from a server-stamped timestamp so the HTML matches,
   then swaps to the real clock. `daysUntil()` and `getTimeRemaining()` reduce
   both dates to UTC days for the same reason. `Countdown` starts its
   per-second tick only after mount.

---

## Accessibility commitments

- Every interactive element is ≥44×44px via `.tap` (WCAG 2.5.5).
- Search is a proper ARIA combobox: arrow keys, `aria-activedescendant`, Escape.
- Filter pills and checklist rows are `aria-pressed` toggles.
- The typewriter is `aria-hidden`; the full line sits in a visually-hidden live
  region, so screen readers get the sentence, not one character at a time.
- Byte is `aria-hidden` throughout — decoration, never content.
- Whole-card links use a stretched pseudo-element, so a card is one hit target
  without nesting buttons inside an anchor.
- A skip-to-content link is the first focusable element.
- `prefers-reduced-motion` disables every animation including the ticker.
- Focus rings are a 3px outline at 3px offset, never removed.
