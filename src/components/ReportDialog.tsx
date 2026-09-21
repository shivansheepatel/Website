import { useState, type ReactNode } from "react";
import { Mail } from "lucide-react";
import { PROGRAMS } from "@/data/programs";
import { SITE } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ReportDialog({ children }: { children: ReactNode }) {
  const [program, setProgram] = useState("");
  const [correction, setCorrection] = useState("");
  const [source, setSource] = useState("");

  const href = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(
    `Correction: ${program || "a listing"}`,
  )}&body=${encodeURIComponent(
    `Opportunity: ${program}\n\nWhat is wrong or out of date:\n${correction}\n\nWhere I saw the correct information:\n${source}\n`,
  )}`;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Report a wrong deadline</DialogTitle>
          <DialogDescription>
            Fill this in and we&apos;ll open a ready-to-send email in your mail app. Nothing is
            stored here and no details are collected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="report-program">Which opportunity?</Label>
            <Input
              id="report-program"
              list="report-program-list"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              placeholder="Start typing a program name"
              className="min-h-11"
            />
            <datalist id="report-program-list">
              {PROGRAMS.map((p) => (
                <option key={p.id} value={p.title} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-correction">What&apos;s wrong?</Label>
            <Textarea
              id="report-correction"
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              placeholder="The deadline is actually March 3, 2027 — the date shown has passed."
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-source">Link to the official page (optional)</Label>
            <Input
              id="report-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="https://"
              className="min-h-11"
            />
          </div>
        </div>

        <DialogFooter>
          <Button asChild className="min-h-11 w-full rounded-full sm:w-auto">
            <a href={href}>
              <Mail className="size-4" aria-hidden />
              Open email
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
