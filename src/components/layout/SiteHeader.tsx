import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, Compass, LayoutDashboard, Map, Menu, Sparkles } from "lucide-react";

import { FEATURES, MASCOT, SITE } from "@/config/site";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/state/onboarding";
import { Byte } from "@/components/mascot/Byte";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type NavItem = { to: string; label: string; short: string; icon: typeof Compass; on: boolean };

function navItems(): NavItem[] {
  return [
    { to: "/explore", label: "Explore", short: "Explore", icon: Compass, on: true },
    { to: "/roadmap", label: "My roadmap", short: "Roadmap", icon: Map, on: true },
    {
      to: "/dashboard",
      label: "Dashboard",
      short: "Dashboard",
      icon: LayoutDashboard,
      on: FEATURES.dashboard,
    },
    {
      to: "/counselors",
      label: "Counsellors & parents",
      short: "Counsellors",
      icon: BookOpen,
      on: FEATURES.counselorPortal,
    },
  ].filter((i) => i.on);
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { openQuiz, personalised, saved, hydrated } = useOnboarding();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const savedCount = hydrated ? saved.length : 0;

  return (
    <header className="no-print sticky top-0 z-40 border-b-2 border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label={`${SITE.name} — home`}
        >
          <span
            aria-hidden
            className="sticker grid size-9 place-items-center rounded-lg bg-accent font-display text-sm font-bold text-accent-foreground"
          >
            {SITE.shortName.slice(0, 2)}
          </span>
          <span className="hidden font-display text-[0.98rem] leading-tight font-bold tracking-tight sm:block">
            {SITE.name}
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {navItems().map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "tap relative inline-flex items-center rounded-full px-3.5 text-sm font-bold transition-colors",
                  active ? "text-primary" : "text-foreground/70 hover:text-foreground",
                )}
              >
                {item.label}
                {item.to === "/roadmap" && savedCount > 0 && (
                  <span className="tabular ml-1.5 rounded-full border-2 border-border bg-coral px-1.5 text-[0.62rem] font-bold text-coral-foreground">
                    {savedCount}
                  </span>
                )}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 bottom-1 h-[3px] rounded-full bg-accent"
                    transition={{ type: "spring", stiffness: 480, damping: 34 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <motion.button
          type="button"
          whileTap={{ y: 2 }}
          onClick={openQuiz}
          className={cn(
            "sticker tap ml-auto inline-flex items-center gap-2 rounded-full px-4 text-sm font-bold active:sticker-press lg:ml-2",
            personalised ? "bg-card hover:bg-secondary" : "bg-primary text-primary-foreground",
          )}
        >
          {MASCOT.enabled && !personalised ? (
            <Byte mood="idle" size="sm" float={false} className="-my-1 -ml-1.5 size-7" />
          ) : (
            <Sparkles className="size-4" aria-hidden />
          )}
          <span className="hidden sm:inline">
            {personalised ? "Retake quiz" : `Ask ${MASCOT.name}`}
          </span>
          <span className="sm:hidden">{personalised ? "Retake" : MASCOT.name}</span>
        </motion.button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="sticker tap grid place-items-center rounded-full bg-card active:sticker-press lg:hidden"
            >
              <Menu className="size-5" aria-hidden />
              <span className="sr-only">Open menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(20rem,86vw)] border-l-2">
            <SheetTitle className="px-4 pt-4 font-display text-xl">{SITE.name}</SheetTitle>
            <nav className="mt-4 flex flex-col gap-1.5 px-3 pb-6" aria-label="Mobile">
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="sticker tap flex items-center gap-3 rounded-xl bg-card px-4 text-base font-bold"
              >
                Home
              </Link>
              {navItems().map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="sticker tap flex items-center gap-3 rounded-xl bg-card px-4 text-base font-bold"
                >
                  <item.icon className="size-4 text-muted-foreground" aria-hidden />
                  {item.short}
                  {item.to === "/roadmap" && savedCount > 0 && (
                    <span className="tabular ml-auto rounded-full border-2 border-border bg-coral px-2 text-xs font-bold text-coral-foreground">
                      {savedCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
