# Running this on your own VM

Notes for moving the project from the Windows laptop to a Linux dev VM in the
home lab, and for running both the site and the data engine there.

---

## 1. Do not copy the folder

Copy the project directory across and the first build will fail with something
like `Cannot find module '@rolldown/binding-linux-x64-gnu'`. This already
happened once during development, so it is not hypothetical: `node_modules`
contains platform-specific native binaries, and the ones sitting in that folder
now were compiled for Windows.

Move the *source*, and let the VM install its own dependencies:

```bash
# On the VM, once the repo is on GitHub:
git clone https://github.com/<you>/apptrack-web.git
cd apptrack-web
npm ci
```

`npm ci` rather than `npm install` — it installs exactly what `package-lock.json`
pins, which is the point of having a lockfile.

If you would rather not wait for GitHub, `git bundle create ../app.bundle --all`
on the laptop moves the whole repo with its history as one file, and
`git clone app.bundle apptrack-web` on the VM unpacks it.

**One thing to settle first:** the repo currently carries *two* lockfiles,
`package-lock.json` (npm) and `bun.lock` (left over from the original scaffold).
They will drift, and whoever runs `bun install` on the VM will get different
package versions from whoever runs `npm ci`. The workflows and every script here
use npm. I would delete `bun.lock` and `bunfig.toml` — say the word and I will,
or keep bun and I will convert the workflows instead. Just don't leave both.

---

## 2. What the VM needs

| | |
| --- | --- |
| Node | **≥ 22.18** — `.nvmrc` says `22`, and `engines` enforces it |
| Why that version | The engine scripts are `.mts` run through Node's built-in type stripping. Older Node cannot execute them. |
| Chromium | Only if the engine will run here: `npx playwright install --with-deps chromium` |
| Disk | ~600 MB for `node_modules`, plus ~400 MB if you install Chromium |
| Outbound network | The engine fetches program pages and calls the Anthropic API. If the VM sits behind a restrictive egress policy, that is the thing to open. |

```bash
node --version          # want v22.18 or newer
nvm use                 # picks up .nvmrc if you use nvm
```

---

## 3. Running the site

The default build targets Cloudflare Workers. For your own VM you want the plain
Node server instead:

```bash
npm run build:node      # NITRO_PRESET=node-server
npm start               # serves on :3000
```

I have run exactly this and confirmed it serves all seven routes.

> On Windows, `npm run build:node` won't work as written — the `VAR=value`
> prefix is POSIX shell. Use `set NITRO_PRESET=node-server && npm run build`
> there, or just use `npm run build` and keep the Cloudflare output. On the VM
> the script is fine.

### As a service

`/etc/systemd/system/apptrack.service`:

```ini
[Unit]
Description=Ontario Student Opportunities
After=network.target

[Service]
Type=simple
User=apptrack
WorkingDirectory=/srv/apptrack-web
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/srv/apptrack-web/.env.local
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now apptrack
sudo systemctl status apptrack
```

Put Caddy or nginx in front for TLS. Nothing in the app needs a database, a
session store, or shared state between instances — it reads its data out of the
bundle at request time — so scaling it is just running more copies.

---

## 4. Where the data engine should run

You now have a real choice, and the home lab makes the second option genuinely
attractive:

**Option A — GitHub Actions** (what `.github/workflows/sync-programs.yml` does).
Runs whether or not your VM is up, no infrastructure, and the pull request it
opens is the review surface. Free on a public repo.

**Option B — cron on the VM.** You are already running the box. The engine is
just a Node script and does not need Actions:

```cron
# /etc/cron.d/apptrack-engine
0 11 * * *  apptrack  cd /srv/apptrack-web && npm run engine:links  >> /var/log/apptrack-engine.log 2>&1
0 12 * * 1  apptrack  cd /srv/apptrack-web && npm run engine -- --mode=all --limit=60 >> /var/log/apptrack-engine.log 2>&1
```

The catch is that the git sink assumes something will open a pull request. On the
VM the engine will edit `src/data/programs.ts` and write `data/review-queue.json`
locally, and then you need to either push a branch yourself or review in place
with `/admin/review`. That is fine — it is just a different rhythm, and it is the
one that keeps everything inside your own network.

**You can also run both**: Actions for discovery and the PR, cron on the VM for
the daily link check. The link check needs no API key and no review.

My suggestion: start with Actions because the review loop is already wired, and
move to cron later if you would rather not depend on GitHub. The engine code is
identical either way.

---

## 5. Secrets on the VM

```bash
# /srv/apptrack-web/.env.local — never committed, .gitignore already covers it
ANTHROPIC_API_KEY=sk-ant-...
# optional
BRAVE_SEARCH_API_KEY=...
```

```bash
sudo chown apptrack:apptrack .env.local
sudo chmod 600 .env.local
```

The systemd unit above reads it via `EnvironmentFile`, so the key never appears
in a process argument or a shell history.

---

## 6. Verify the move worked

On the VM, in order:

```bash
npm ci
npm run typecheck        # clean
npm run lint             # 0 errors (12 pre-existing warnings)
npm run check:engine     # passes
npm run check:engine:data # 68 assertions pass
npm run build:node       # succeeds
npm start                # then curl localhost:3000
```

If `check:engine:data` passes on the VM, the engine is functional there — that
suite needs no network and no API key, which is exactly what makes it a good
smoke test for a fresh machine.
