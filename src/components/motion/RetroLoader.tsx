/**
 * Loading state: a striped progress bar and a hopping sprite.
 *
 * The bar is indeterminate on purpose — a fake percentage that jumps to 90%
 * and waits is a small lie, and students notice. It animates to show the page
 * is alive, and says what it is doing in words.
 */

import { motion, useReducedMotion } from "framer-motion";

import { MASCOT } from "@/config/site";
import { Byte } from "@/components/mascot/Byte";
import { cn } from "@/lib/utils";

export function RetroLoader({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div
      className={cn("mx-auto flex max-w-sm flex-col items-center gap-4 px-4 py-20", className)}
      role="status"
      aria-live="polite"
    >
      {MASCOT.enabled ? (
        <Byte mood="curious" size="lg" />
      ) : (
        <motion.span
          aria-hidden
          className="size-8 rounded-md border-2 border-border bg-accent"
          {...(reduce
            ? {}
            : {
                animate: { y: [0, -12, 0], rotate: [0, 8, 0] },
                transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" as const },
              })}
        />
      )}

      <div className="sticker h-5 w-full overflow-hidden rounded-full bg-sunk p-0.5">
        <motion.div
          className="stripes h-full w-1/3 rounded-full bg-primary"
          {...(reduce
            ? { style: { width: "100%" } }
            : {
                animate: { x: ["-110%", "320%"] },
                transition: { duration: 1.25, repeat: Infinity, ease: "linear" as const },
              })}
        />
      </div>

      <p className="kicker">{label}</p>
    </div>
  );
}
