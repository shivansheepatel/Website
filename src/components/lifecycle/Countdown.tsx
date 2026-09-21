/**
 * A live countdown to an application deadline.
 *
 * SSR-SAFE BY CONSTRUCTION: the first render uses the shared clock from
 * `useNow()`, which is seeded from the server's timestamp, so the server HTML
 * and the client's first paint are identical. A mount effect then swaps in the
 * browser's real clock and starts ticking — every second inside the last two
 * days, once a minute before that, because a per-second re-render for a
 * deadline three months out is pure battery drain.
 */

import { useEffect, useState } from "react";

import { getTimeRemaining } from "@/lib/program-schema";
import { cn } from "@/lib/utils";
import { useNow } from "@/state/now";

function Cell({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="sticker tabular grid min-w-[2.5rem] place-items-center rounded-md bg-card px-1.5 py-1 font-display text-lg leading-none font-bold">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[0.6rem] font-bold tracking-wider text-muted-foreground uppercase">
        {unit}
      </span>
    </div>
  );
}

export function Countdown({
  target,
  variant = "full",
  className,
}: {
  target: string | null;
  /** `full` = boxed digits, `inline` = one line of text. */
  variant?: "full" | "inline";
  className?: string;
}) {
  const seeded = useNow();
  const [live, setLive] = useState<Date | null>(null);

  useEffect(() => {
    if (!target) return undefined;
    setLive(new Date());
    const remaining = getTimeRemaining(target, new Date());
    const everyMs = remaining.days < 2 ? 1000 : 60_000;
    const id = window.setInterval(() => setLive(new Date()), everyMs);
    return () => window.clearInterval(id);
  }, [target]);

  const t = getTimeRemaining(target, live ?? seeded);
  if (!target) return null;

  if (variant === "inline") {
    return (
      <span data-countdown className={cn("font-bold", className)}>
        {t.expired ? t.label : t.days > 2 ? t.label : t.clock}
      </span>
    );
  }

  if (t.expired) {
    return <p className={cn("text-sm font-bold text-muted-foreground", className)}>{t.label}</p>;
  }

  return (
    <div data-countdown className={cn("flex items-start gap-1.5", className)}>
      <Cell value={t.days} unit={t.days === 1 ? "day" : "days"} />
      <Cell value={t.hours} unit="hrs" />
      <Cell value={t.minutes} unit="min" />
      {t.days < 2 && <Cell value={t.seconds} unit="sec" />}
    </div>
  );
}
