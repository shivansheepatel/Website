# Going live

Five steps from "repo on this laptop" to "site updates itself". Each one says
who does it — the browser parts need you; the terminal parts I can run.

Current state: the repo is initialised with one commit (`b686dfc`), the engine
is installed and passing its checks, and `npm run build` emits a Cloudflare
Worker. Nothing is on GitHub and nothing is deployed yet.

---

## Step 1 — Put the repo on GitHub · **you, ~5 min**

1. Go to <https://github.com/new>.
2. Repository name: `apptrack-web` (or whatever you like).
3. **Private** is fine and costs nothing for Actions on a repo this size —
   though public gets unlimited Actions minutes, and there is nothing secret in
   this codebase. Your call.
4. **Do not** tick "Add a README", "Add .gitignore" or "Choose a licence" —
   the repo already has all three, and pre-filling them creates a conflict on
   the first push.
5. Create it, then copy the URL it shows you.

Then, in the project folder — or tell me the URL and I'll run it:

```bash
git remote add origin https://github.com/<you>/apptrack-web.git
git push -u origin main
```

Windows will open a browser window to sign you in to GitHub the first time.
That prompt cannot be answered from here, so if I run the push and it hangs,
that is why — run it yourself once and the credential is cached afterwards.

---

## Step 2 — Let Actions open pull requests · **you, ~2 min**

The whole review design is PR-based, and this is off by default.

**Settings → Actions → General → Workflow permissions:**

- ☑ Read and write permissions
- ☑ Allow GitHub Actions to create and approve pull requests

Then **Issues → Labels → New label**, twice: `data-engine` and `link-health`.
The workflows file things under these; without them the runs still work but the
tidying does not.

---

## Step 3 — The Groq key · **you, ~5 min, genuinely free**

Groq (not Anthropic) is what the engine calls now — chosen specifically because
its free tier needs no credit card and has no bill to run up.

1. <https://console.groq.com> → sign up → **API Keys** → **Create API Key**.
   Call it `apptrack-engine`. Copy it — the console will not show it again.
2. There is no spend limit to set — the free tier does not bill. It can rate-
   limit you instead (see `docs/DATA-PIPELINE.md` §9.2 and §10 for the current
   numbers and how the engine paces itself against them).
3. On this machine, create `.env.local` in the project folder:

   ```
   GROQ_API_KEY=gsk_...
   ```

   `.gitignore` already covers `.env*`, so it cannot be committed by accident.
4. On GitHub: **Settings → Secrets and variables → Actions → New repository
   secret**. Name it exactly `GROQ_API_KEY`, paste the same value.

Optional, for search-based discovery: a free Brave Search key from
<https://brave.com/search/api/> as `BRAVE_SEARCH_API_KEY`. Without it discovery
runs on the seed hubs alone, which works.

---

## Step 4 — Deploy to Cloudflare · **you, ~15 min**

The build already targets Cloudflare Workers and writes the config, so this is
the short path. `DEPLOY.md` has the alternatives if you would rather use Vercel
or Netlify.

1. Free account at <https://dash.cloudflare.com>.
2. In the project folder: `npx wrangler login` — opens a browser to authorise.
3. `npx wrangler deploy` — or I can run this once you are logged in.
4. It prints a `*.workers.dev` URL. Open it and click through the site.
5. **Then connect it to the repo** so merges rebuild automatically: in the
   Cloudflare dashboard, **Workers & Pages → your worker → Settings → Build**,
   connect the GitHub repo, branch `main`, build command `npm run build`.

That last part is the step that makes any of this "constant". Until the deploy
is wired to `main`, merging a data PR changes a file and nothing else.

Afterwards, set `SITE.url` in `src/config/site.ts` to the real URL.

---

## Step 5 — First real engine run · **me, once you have the key**

In this order, smallest first:

```bash
npm run engine:seeds                                   # which seed hubs are alive
npm run engine -- --mode=verify --limit=5 --dry-run    # 5 pages, writes nothing
npm run engine -- --mode=verify --limit=20             # for real
```

Expect the seed check to fail on several URLs — they were written from general
knowledge and never fetched. That is what the command is for. Expect the first
extractions to need prompt tuning too; `scripts/engine/prompts.mts` is the file
to adjust, and `npm run check:engine:data` is what tells you whether a change
helped.

Once that looks right, the workflow takes over on its own: link health daily at
11:00 UTC, full crawl Mondays at 12:00 UTC.

---

## The weekly rhythm, after all that

Monday the crawl runs and opens a PR titled *Data engine sync*.

You read it. The PR body lists every proposed change with the sentence from the
source page behind each date. Most weeks it will be short.

- Happy with everything → merge. Cloudflare rebuilds. Done, about five minutes.
- Want the nicer interface → `npm run dev`, open `/admin/review`, use A and R
  to clear the queue, Save, then `npm run engine:apply`, commit, push.

If a week goes by with nobody looking, nothing breaks — but the site quietly
goes stale while the automation keeps reporting success. That is the one failure
mode this design has, and it is the direct cost of never letting a machine
publish a deadline on its own.

---

## Still outstanding

`SITE.contactEmail` is `hello@ontariostudentopportunities.ca`, a domain nobody
owns. The crawler puts it in its User-Agent so the sites it visits can reach
you. Point it at a real inbox before Step 5 — you are about to start making
automated requests to other people's servers, and a working contact address is
the courtesy that keeps you welcome.
