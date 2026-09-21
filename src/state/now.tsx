/**
 * A shared, hydration-safe "now".
 *
 * Every deadline countdown on this site is computed at render time — that is
 * the whole point of the architecture. But the server renders in UTC and the
 * student's browser renders in their own timezone, so calling `new Date()`
 * independently in both places can produce "14 days left" on the server and
 * "13 days left" in the browser, which React reports as a hydration mismatch.
 *
 * So: the root route's loader stamps the server's time, the first client
 * render uses that exact value (matching the HTML byte for byte), and an
 * effect immediately swaps in the browser's real clock. After that it ticks
 * every half hour so a tab left open overnight does not show yesterday's
 * countdown.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const NowContext = createContext<Date | null>(null);

const TICK_MS = 30 * 60 * 1000;

export function NowProvider({
  serverNow,
  children,
}: {
  serverNow?: string | undefined;
  children: ReactNode;
}) {
  const [now, setNow] = useState<Date>(() => (serverNow ? new Date(serverNow) : new Date()));

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return <NowContext.Provider value={now}>{children}</NowContext.Provider>;
}

/** The current time, stable within a render pass. */
export function useNow(): Date {
  return useContext(NowContext) ?? new Date();
}
