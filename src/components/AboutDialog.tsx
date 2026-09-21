import type { ReactNode } from "react";

import { SITE } from "@/config/site";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AboutDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">About &amp; how this works</DialogTitle>
          <DialogDescription>
            {`A free, independent list of opportunities for ${SITE.region} high school students.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm leading-relaxed text-foreground/85">
          <section>
            <h3 className="text-base font-semibold text-foreground">Who this is for</h3>
            <p className="mt-1">
              {`Students in Grades 9–12 in ${SITE.region}, plus the parents and guidance counsellors
              helping them find programs, competitions, scholarships and paid positions.`}
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-foreground">
              How opportunities are chosen
            </h3>
            <p className="mt-1">
              Every listing is a real program run by a university, non-profit, government body or
              established organisation, open to Ontario students, and free or low cost wherever
              possible. Each one links straight to its official page — nothing here asks you to
              apply through us.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-foreground">
              Confirmed vs. estimated dates
            </h3>
            <ul className="mt-1 space-y-2">
              <li>
                <span className="font-semibold text-confirmed">Verified</span> — the date is posted
                on the organiser&apos;s own site for this cycle and our weekly freshness check has
                confirmed the listing recently.
              </li>
              <li>
                <span className="font-semibold text-estimated">Estimated</span> — this cycle&apos;s
                date is not posted yet, so we show the date it usually falls on. Treat it as a rough
                guide and check the official page.
              </li>
              <li>
                <span className="font-semibold">Dates not posted yet</span> — the program runs, but
                there is no reliable date to show.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-semibold text-foreground">How often it is updated</h3>
            <p className="mt-1">
              An automated check runs every week: it re-tests every application link and flags
              deadlines that have passed or listings nobody has verified lately. Anything it cannot
              confirm is marked &ldquo;needs re-checking&rdquo; rather than left looking certain.
              Each listing shows when it was last verified.
            </p>
          </section>

          <p className="rounded-xl bg-muted p-3 text-xs">
            This is a student-built project, not affiliated with any of the organisations listed.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
