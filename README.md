# Ontario Student Opportunities

A free, public directory of summer programs, competitions, scholarships and
paid positions for high school students in Grades 9–12 — with an application
lifecycle engine, a mascot-guided onboarding quiz, and a personal roadmap that
lays every dated milestone out term by term.

Every listing links straight to the organiser's own application page, and
every date is labelled **verified**, **estimated** or **not published**, so
students know exactly what to trust.

This is the web front end of the AppTrack project. The Discord bot is a
separate program that reads the same opportunity data; the two are independent
and either can run without the other.

---

## What the site does

**Six pages, one job each.**

| Route          | What happens there                                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`            | Hero search with live autosuggestions, Byte's invitation, a "closing soon" ticker, and twelve interest tracks with real counts                                                                                           |
| `/explore`     | The full catalogue with multi-facet filters — application status, track, subject, grade, cost, format, time — plus **grid, list and timeline** views. All of it lives in the URL, so a filtered view is a shareable link |
| `/program/:id` | A lifecycle header that reshapes itself by phase, the four key dates (including the ones nobody published), and an interactive preparation checklist                                                                     |
| `/roadmap`     | Every dated milestone — opens, closes, starts — laid out term by term, with `.ics` export, per-item Google Calendar links and a clean print layout                                                                       |
| `/dashboard`   | Saved programs grouped by what to do about them, prep progress, submitted applications, cohort watch list and skill badges                                                                                               |
| `/counselors`  | A share-link builder for a whole class, printable batch checklists, and plain-language guides                                                                                                                            |

### The application lifecycle

Program cards and detail pages rearrange themselves around what a student can
actually do right now:

| Phase                 | What the layout leads with                                                         |
| --------------------- | ---------------------------------------------------------------------------------- |
| **Opening soon**      | The date applications open, and how long there is to line up references and drafts |
| **Applications open** | A live countdown, the apply link and the materials checklist                       |
| **In session**        | The real run dates, plus an "alert me for the next cohort" toggle                  |
| **Closed**            | Dimmed, with the month it usually closes so next cycle can be planned              |
| **Rolling**           | No countdown at all, because there is no date to count to                          |

Status is computed at render time by `getProgramStatus()` — never baked into a
build — so a deadline that passes at midnight is closed on the next page load.

**Byte, the companion.** A hand-drawn SVG mascot guides the four-question
onboarding quiz with typewriter dialogue that reacts to each answer, and
reappears on the roadmap and dashboard. Every step has a prominent skip, and
the whole character can be switched off in config.

**No accounts, no tracking, no cookies.** Quiz answers, saved programs,
checklists and badges live in the student's own browser and never reach a
server.

---

## Tech stack

| Piece                            | What it is                                                  |
| -------------------------------- | ----------------------------------------------------------- |
| TanStack Start + TanStack Router | SSR React framework and file-based routing                  |
| React 19 + TypeScript            | UI, strict mode, `exactOptionalPropertyTypes` on            |
| Tailwind CSS v4                  | Styling via `src/styles.css` — token-driven, no config file |
| Framer Motion                    | Route transitions, spring presses, card tilt, quiz slides   |
| shadcn/ui + Radix                | Accessible primitives in `src/components/ui/`               |
| Lucide React                     | Icons                                                       |
| Vite + Nitro                     | Build; auto-targets Vercel, Netlify or Cloudflare           |

No state library: there are two pieces of shared client state and one of them
is a clock, so React context is the right size.

---

## Running it locally

You need [Node.js](https://nodejs.org) 20 or newer.

```sh
npm install
npm run dev
```

Other commands:

```sh
npm run build                     # production build into .output/
npm run preview                   # serve the production build
npm run typecheck                 # tsc --noEmit
npm run lint                      # eslint + prettier check
npm run format                    # auto-fix formatting
npm run check:engine              # assertions over lifecycle, matching, roadmap
npm run check:freshness           # probe every URL, flag expired/stale/missing dates
npm run check:freshness:offline   # the same without network access
npm run routes:generate           # regenerate routeTree.gen.ts without a full build
```

---

## Documentation

| Document                                               | What is in it                                                                           |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| **[FORKING.md](./FORKING.md)**                         | Clone, configure, re-skin, rename the mascot and deploy — start here                    |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)**               | Folder blueprint, the lifecycle engine, data flow, design system, motion, accessibility |
| **[docs/DATA-PIPELINE.md](./docs/DATA-PIPELINE.md)**   | How the data is kept true, what the daily check does, how to scale to a CMS or database |
| **[DEPLOY.md](./DEPLOY.md)**                           | Cloudflare Workers walkthrough with automatic deploys                                   |
| **[MERGED-FROM-TRACKER.md](./MERGED-FROM-TRACKER.md)** | What was carried over from the original spreadsheet                                     |

---

## Editing the opportunity data

Every listing lives in **`src/data/programs.ts`**, in the `seeds` array:

```ts
{
  title: "Program name as the organiser writes it",
  org: "Who runs it",
  category: "STEM",              // STEM | Business | Medicine | Law & Civics | Leadership | Arts
  grades: [10, 11, 12],
  summary: "One sentence for the card.",
  description: "A short paragraph for the detail page.",
  eligibility: "Who can apply, and anything that trips people up.",

  deadline: "2027-03-01",        // ISO date, or null if nothing is posted
  confidence: "estimated",       // confirmed | estimated | unposted

  appOpenDate: null,             // optional — powers "Opening soon"
  programStartDate: null,        // optional — powers "In session"
  programEndDate: null,

  cost: "Free",
  format: "In person, residential",
  location: "Toronto",
  equity: "Optional — note any stream for underrepresented students.",
  url: "https://official-page.example/apply",
},
```

Rules worth keeping:

- **`confidence: "confirmed"`** only when the date is posted on the
  organiser's own site for _this_ cycle. Last year's pattern is `"estimated"`.
  No reliable date at all is `deadline: null` + `confidence: "unposted"`.
- **Never guess a lifecycle date.** Leave `appOpenDate` and the run dates
  `null` until you have them from source. The UI has an honest "not published"
  variant for each; a fabricated open date sends a student to a form that does
  not exist yet.
- `CHECKED` near the top is the "last verified" date shown on every listing.
  Bump it after each verification pass; it drives the "needs re-checking" flag.
- Cost tier, time commitment, delivery mode and skill tags are **derived** from
  the text you write. Do not add fields for them.

After editing, run `npm run typecheck` and `npm run check:freshness:offline`.

---

## Making the site yours

Two files, both heavily commented:

- **`src/config/site.ts`** — name, region, contact email, grades, the mascot,
  hero copy, feature toggles, lifecycle thresholds, prep steps, badges.
  ⚠️ Change `SITE.contactEmail` before launch; the default is a placeholder
  domain nobody owns, so corrections will bounce.
- **`src/styles.css`** — eight brand colour anchors and two font families at
  the top of the file. Everything else derives from them.

[FORKING.md](./FORKING.md) walks through both.

---

## Automated checks

| Workflow                          | When                          | What it does                                                                                                                  |
| --------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`        | Every push and PR             | Typecheck → lint → engine checks → offline data check → build                                                                 |
| `.github/workflows/freshness.yml` | Daily 11:00 UTC, or on demand | Probes every program URL, flags expired and stale listings and incomplete lifecycle dates, maintains one rolling GitHub issue |

Neither needs a secret. Cloudflare auto-deploy is commented out at the bottom
of `ci.yml`.

---

## Notes

- `src/routeTree.gen.ts` is generated. Do not edit it; `npm run dev`,
  `npm run build` and `npm run routes:generate` all rewrite it.
- `src/lib/lovable-error-reporting.ts` reports errors to the Lovable editor and
  is a no-op anywhere else. Safe to delete if you stop using Lovable.
- Both `bun.lock` and `package-lock.json` are checked in. Use whichever you
  prefer, but stick to one.

---

## Disclaimer

This is a student-built project and is not affiliated with any of the
organisations listed. Deadlines change without notice — always confirm on the
official page before planning around one.
