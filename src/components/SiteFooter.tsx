import { Link } from "@tanstack/react-router";
import { Bot, Mail, ShieldOff } from "lucide-react";

import { DISCORD_URL, FEATURES, SITE } from "@/config/site";
import { AboutDialog } from "@/components/AboutDialog";
import { ReportDialog } from "@/components/ReportDialog";

export function SiteFooter() {
  return (
    <footer className="no-print mt-20 border-t-2 border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="font-display text-lg font-bold">{SITE.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">{SITE.tagline}</p>
        </div>

        <nav aria-label="Footer" className="space-y-1.5 text-sm">
          <p className="kicker">Browse</p>
          <Link
            to="/explore"
            className="block font-medium text-foreground/80 hover:text-foreground"
          >
            All opportunities
          </Link>
          <Link
            to="/roadmap"
            className="block font-medium text-foreground/80 hover:text-foreground"
          >
            My roadmap
          </Link>
          {FEATURES.dashboard && (
            <Link
              to="/dashboard"
              className="block font-medium text-foreground/80 hover:text-foreground"
            >
              My dashboard
            </Link>
          )}
          {FEATURES.counselorPortal && (
            <Link
              to="/counselors"
              className="block font-medium text-foreground/80 hover:text-foreground"
            >
              Counsellors &amp; parents
            </Link>
          )}
        </nav>

        <div className="space-y-1.5 text-sm">
          <p className="kicker">Help &amp; corrections</p>
          <AboutDialog>
            <button
              type="button"
              className="block text-left font-medium text-foreground/80 hover:text-foreground"
            >
              About &amp; how this works
            </button>
          </AboutDialog>
          <ReportDialog>
            <button
              type="button"
              className="block text-left font-medium text-foreground/80 hover:text-foreground"
            >
              Report a wrong deadline
            </button>
          </ReportDialog>
          <p className="flex items-center gap-2 pt-1 text-muted-foreground">
            <Mail className="size-4 shrink-0" aria-hidden />
            <a className="underline underline-offset-4" href={`mailto:${SITE.contactEmail}`}>
              {SITE.contactEmail}
            </a>
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <p className="kicker flex items-center gap-1.5">
            <ShieldOff className="size-3.5" aria-hidden />
            No tracking, no cookies
          </p>
          <p className="text-muted-foreground">
            Your quiz answers, saved list and checklists stay in your own browser and never reach a
            server.
          </p>
          {DISCORD_URL && (
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="sticker tap inline-flex items-center gap-2 rounded-full bg-card px-4 text-sm font-bold active:sticker-press"
            >
              <Bot className="size-4" aria-hidden />
              Get the Discord bot
            </a>
          )}
        </div>
      </div>
      <p className="px-4 pb-10 text-center text-xs text-muted-foreground">{SITE.disclaimer}</p>
    </footer>
  );
}
