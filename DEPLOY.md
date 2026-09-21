# Deploying

## Read this first: it is not a static site

The old version of this project generated plain HTML files, which could be hosted
free on GitHub Pages. **This version cannot.** TanStack Start renders pages on a
server, so `npm run build` produces a server bundle in `.output/`, not a folder of
`.html` files. GitHub Pages, Neocities and other static-only hosts will not run it.

That is the one real trade-off in moving to this stack. In exchange you get a much
better interface. All the hosts below have a free tier that covers a site of this
size comfortably.

## Option 1 — Cloudflare Workers (what the build already targets)

The build already emits a Cloudflare Worker and writes `.output/server/wrangler.json`
for you, so this is the shortest path.

1. Make a free account at [dash.cloudflare.com](https://dash.cloudflare.com).
2. From the project folder:

   ```sh
   npm install
   npm run build
   npx wrangler deploy --config .output/server/wrangler.json
   ```

   The first run opens a browser window to log in.

3. Wrangler prints a `*.workers.dev` URL. That is your live site.

To use your own domain later, add it in the Cloudflare dashboard under
**Workers & Pages → your worker → Settings → Domains & Routes**.

### Deploying automatically on every push

1. In Cloudflare, go to **My Profile → API Tokens → Create Token** and use the
   **Edit Cloudflare Workers** template. Copy the token.
2. In your GitHub repo, go to **Settings → Secrets and variables → Actions → New
   repository secret** and add:
   - `CLOUDFLARE_API_TOKEN` — the token you just made
   - `CLOUDFLARE_ACCOUNT_ID` — shown on the right side of the Cloudflare dashboard
3. Uncomment the `deploy` job at the bottom of `.github/workflows/ci.yml`.

Every push to `main` will then build and deploy on its own.

## Option 2 — Vercel or Netlify

Both detect the project automatically and need no config file.

- **Vercel** — [vercel.com/new](https://vercel.com/new), import the GitHub repo,
  accept the detected settings, deploy.
- **Netlify** — [app.netlify.com](https://app.netlify.com), "Add new site" → import
  from Git. Build command `npm run build`.

Both redeploy on every push to `main` with no extra setup.

## Option 3 — Any Node host

`npm run build` then `npm run preview` serves the built app. On a VPS you would run
the server bundle under a process manager. This is the most work and there is no
reason to pick it unless you are already paying for a server.

## Before you go public

- [ ] **Rotate the leaked credentials from the old bot folder.** The old `.env`
      contained a live Discord bot token, a Groq API key and a Tavily API key. Any
      copy of that file — including a git history that ever contained it — means
      those keys should be treated as public. Reset the Discord token in the
      Developer Portal, and delete and regenerate the Groq and Tavily keys.
- [ ] Set a real `CONTACT_EMAIL` in `src/lib/site.ts`.
- [ ] Set `SITE_URL` in `src/lib/site.ts` once you know the domain.
- [ ] Confirm `.env` is never committed — `.gitignore` covers `*.local` and
      `.dev.vars`, but add a plain `.env` line if you ever add one here.
- [ ] Run `npm run lint` and `npx tsc --noEmit` — both should be clean.
- [ ] Re-check the handful of deadlines closing soonest; a directory that shows a
      passed deadline as upcoming loses trust fast.
