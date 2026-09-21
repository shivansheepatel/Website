# Fork it for your school

This site is built to be cloned. Everything specific to one deployment — the
name, the region, the contact address, the colours, the copy on the front page —
lives in two files. A school board, a non-profit or another student can have
their own running instance in about twenty minutes.

No licence fee, no account, no back end.

---

## 1. Get it running locally

You need [Node.js](https://nodejs.org) 20 or newer. Node 22 is what CI uses.

```sh
git clone <your-fork-url> opportunities
cd opportunities
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). Edits hot-reload.

> **Windows note:** if `npm run build` fails with `Cannot find module
'@rolldown/binding-...'`, your `node_modules` was installed for a different
> platform. Delete it and reinstall: `rm -rf node_modules && npm install`.

---

## 2. Make it yours — `src/config/site.ts`

This is the one file you have to edit. Open it and work top to bottom; every
value is commented.

```ts
export const SITE = {
  name: "Ontario Student Opportunities", // header, titles, calendar feed
  shortName: "OSO", // mobile header, .ics UIDs
  tagline: "Programs, competitions…", // footer, search results
  region: "Ontario", // used in body copy, not hard-coded
  url: "", // canonical origin, no trailing slash
  contactEmail: "hello@example.ca", // ⚠️ CHANGE THIS — corrections go here
  grades: [9, 10, 11, 12], // drives the quiz and the filters
  disclaimer: "Deadlines can change…", // printed on every page and export
};
```

**Change `contactEmail` before launch.** The default is a placeholder domain
nobody owns, so every correction a student sends will bounce silently. Any
address you actually read is fine.

Then the rest of the file:

| Block            | What it controls                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `HERO`           | Front-page headline, subhead and quiz prompt                                                    |
| `FEATURES`       | Toggle the quiz auto-open, ticker, calendar export, print export, resources hub, Discord button |
| `DEADLINE_RULES` | When a deadline counts as "closing soon", and how long a listing stays verified                 |
| `DISCORD`        | Companion bot application ID — set `clientId: ""` to hide the button                            |
| `STORAGE_KEYS`   | Bump a version suffix to invalidate everyone's saved profile                                    |

---

## 3. Re-skin it — `src/styles.css`

The whole theme is six colour anchors at the top of the file:

```css
--brand-paper: oklch(0.977 0.004 95); /* page background */
--brand-ink: oklch(0.24 0.045 258); /* body type       */
--brand-primary: oklch(0.42 0.115 255); /* buttons, links  */
--brand-accent: oklch(0.79 0.135 72); /* highlights      */
--brand-alert: oklch(0.6 0.175 30); /* urgency only    */
--brand-positive: oklch(0.5 0.12 155); /* verified green  */
```

Colours are **oklch(lightness chroma hue)**. Keep the first number where it is
and change the third to move the hue — contrast stays safe automatically. If
you have hex codes from a brand guide, convert them at
[oklch.com](https://oklch.com).

Fonts are two lines in the same file plus one `<link>` in
`src/routes/__root.tsx`. Swap both and nothing else changes.

> Do not add a second accent colour. The palette is small on purpose: coral
> means "act now" and nothing else, which is what makes urgency readable.

---

## 4. Put your own programs in — `src/data/programs.ts`

Each listing is one object in the `seeds` array:

```ts
{
  title: "SHAD Canada Summer Program",
  org: "SHAD",
  category: "STEM",              // must be one of the CATEGORIES at the top
  grades: [10, 11, 12],
  summary: "One sentence a student reads on the card.",
  description: "A paragraph. What it actually is, in plain language.",
  eligibility: "Who can apply, including anything easy to miss.",

  deadline: "2026-11-25",        // ISO date, or null if genuinely unposted
  confidence: "confirmed",       // "confirmed" | "estimated" | "unposted"

  // --- lifecycle dates: optional, and LEAVE THEM OUT RATHER THAN GUESS ---
  appOpenDate: "2026-09-15",     // drives the "Opening soon" state
  programStartDate: "2027-07-05",// drives the "In session" state
  programEndDate: "2027-07-30",

  cost: "$6,500 — need-based financial aid available",
  format: "In person, residential",
  location: "Host campuses across Canada",
  equity: "Priority for…",       // optional
  url: "https://www.shad.ca/",   // the organiser's own page, never a redirect
  sourceUrl: "https://…/dates",  // optional, where the dates came from
}
```

### The lifecycle dates

`appOpenDate`, `programStartDate` and `programEndDate` are what power the
Opening-soon and In-session layouts. They are optional because most organisers
do not publish them — at the time of writing **0 of the 129 listings have
them**, which is why those two states are rare in a fresh clone.

Fill them in as you verify listings. Never estimate one: the UI has an honest
"not published by the organiser" variant for every missing date, and a guessed
open date sends a student to a form that does not exist yet. `npm run
check:freshness` prints a coverage table and a worklist of what is missing.

Three things the codebase derives for you — do not add fields for them:

- **Cost tier** (free / paid position / aid available / paid) is parsed from
  your `cost` sentence, and the sentence is always shown alongside it.
- **Time commitment** and **delivery mode** are parsed from `format`,
  `location` and the description.
- **Skills** are matched from the listing's own text against
  `src/data/taxonomy.ts`. A program is never tagged with a skill its own
  description does not support.

`id` is generated from the title. Set it explicitly only if you need a stable
URL across a rename.

Update the `CHECKED` constant near the top whenever you do a verification pass —
that is what drives the "needs re-checking" flag.

### Changing the categories

Edit the `Category` union and `CATEGORIES` array in `programs.ts`, then add the
matching icon and colour in `src/lib/category.ts` and a colour token in
`styles.css`. Update `INTERESTS` in `src/data/taxonomy.ts` so the quiz offers
it. TypeScript will point at every place you still need to touch.

---

## 5. Check your data

```sh
npm run typecheck                 # catches a malformed listing immediately
npm run check:engine              # proves the lifecycle, matching and roadmap logic holds
npm run check:freshness:offline   # expired deadlines, stale listings, schema issues
npm run check:freshness           # the above plus a probe of every URL
```

The full check needs unrestricted outbound network access. On a school or
managed network it may report every link as failed — that is the firewall, not
your data. It runs correctly in GitHub Actions, which is where it is meant to
live. See `docs/DATA-PIPELINE.md`.

---

## 6. Deploy

The build server-renders, so it is **not** a static site — GitHub Pages and
Neocities will not run it. Every option below has a free tier that covers a
site this size comfortably.

### Vercel

Zero config. Nitro auto-detects Vercel and builds for it.

1. Push your fork to GitHub.
2. [vercel.com/new](https://vercel.com/new) → import the repository.
3. Accept the defaults (`npm run build`) and deploy.

### Netlify

Also zero config, same auto-detection.

1. Push your fork to GitHub.
2. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an
   existing project**.
3. Build command `npm run build`. Deploy.

### Cloudflare Workers

What the build targets by default when nothing else is detected.

```sh
npm run build
npx wrangler deploy --config .output/server/wrangler.json
```

`DEPLOY.md` has the full walkthrough including automatic deploys on push.

### Pinning a target explicitly

Only needed if auto-detection guesses wrong — a self-hosted runner, say:

```ts
// vite.config.ts
export default defineConfig({
  nitro: { preset: "vercel" }, // or "netlify", "node-server", "bun"…
  tanstackStart: { server: { entry: "server" } },
});
```

`NITRO_PRESET=node-server npm run build` does the same thing from the shell.

---

## 7. What runs automatically once it is on GitHub

| Workflow        | When                          | What it does                                                                                                       |
| --------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `ci.yml`        | Every push and PR             | Typecheck → lint → offline data check → build                                                                      |
| `freshness.yml` | Daily 11:00 UTC, or on demand | Probes every URL, flags expired and stale listings and incomplete lifecycle dates, keeps one rolling issue updated |

Both work with no secrets. Cloudflare auto-deploy is commented out at the
bottom of `ci.yml` — uncomment it and add two secrets to turn it on.

---

## Checklist before you tell students about it

- [ ] `SITE.contactEmail` is an address you read
- [ ] `MASCOT.name` is the character you want (or `enabled: false`)
- [ ] `SITE.url` is your real domain
- [ ] `SITE.name`, `shortName`, `region` and `tagline` are yours
- [ ] The hero copy in `HERO` says what you want it to say
- [ ] Every listing links to the organiser's own page
- [ ] `npm run check:freshness` is clean
- [ ] `npm run build` succeeds
- [ ] You opened it on a phone and tapped through the quiz
- [ ] `DISCORD.clientId` points at your bot, or is `""`

---

## What it costs to keep running

Hosting: free on all three platforms at this traffic. Maintenance: about an
hour a month reading the Monday freshness issue and fixing what it flags — plus
a bigger pass each September and January, when most of the following year's
deadlines get posted.

That is the real cost of a directory like this, and it is worth knowing before
you start rather than after.
