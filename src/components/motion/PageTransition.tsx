/**
 * Route transitions.
 *
 * Keyed on the pathname so every navigation gets a fade-and-lift. Deliberately
 * short (220ms) and deliberately small (10px): a transition a student notices
 * on the second navigation is a transition that is too long. `mode="wait"`
 * avoids the two-pages-overlapping flash that looks broken on slow devices.
 *
 * Respects `prefers-reduced-motion` — with it on, pages simply appear.
 */

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
