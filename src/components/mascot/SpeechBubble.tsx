/**
 * Byte's speech bubble, with a typewriter reveal.
 *
 * ACCESSIBILITY: the animated text is `aria-hidden`; the full line is rendered
 * once in a visually-hidden live region. Screen readers get the sentence, not
 * one character at a time. `prefers-reduced-motion` skips the animation and
 * prints the line immediately — the effect is decoration, never the content.
 *
 * Clicking or tapping the bubble completes the line at once, because a student
 * reading faster than the typewriter should never have to wait for it.
 */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

const CHARS_PER_SECOND = 55;

export function useTypewriter(text: string, enabled: boolean) {
  const reduce = useReducedMotion();
  const instant = reduce || !enabled;
  const [shown, setShown] = useState(instant ? text.length : 0);
  const frame = useRef<number>(0);

  useEffect(() => {
    if (instant) {
      setShown(text.length);
      return undefined;
    }
    setShown(0);
    const started = performance.now();
    const tick = (t: number) => {
      const chars = Math.floor(((t - started) / 1000) * CHARS_PER_SECOND);
      if (chars >= text.length) {
        setShown(text.length);
        return;
      }
      setShown(chars);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [text, instant]);

  return {
    visible: text.slice(0, shown),
    done: shown >= text.length,
    finish: () => setShown(text.length),
  };
}

export function SpeechBubble({
  text,
  enabled = true,
  className,
}: {
  text: string;
  enabled?: boolean;
  className?: string;
}) {
  const { visible, done, finish } = useTypewriter(text, enabled);

  return (
    <div
      className={cn("sticker pixel-corner relative rounded-xl bg-card px-4 py-3", className)}
      onClick={finish}
      role="presentation"
    >
      {/* the tail, drawn as two stacked triangles so the ink outline reads */}
      <span
        aria-hidden
        className="absolute top-5 -left-[9px] size-0 border-y-8 border-r-[9px] border-y-transparent border-r-border"
      />
      <span
        aria-hidden
        className="absolute top-5 -left-[6px] size-0 border-y-8 border-r-[9px] border-y-transparent border-r-card"
      />

      <p aria-hidden className="text-sm leading-relaxed font-medium text-pretty">
        {visible}
        {!done && (
          <span
            className="animate-caret ml-0.5 inline-block w-[2px] bg-foreground align-middle"
            style={{ height: "1em" }}
          />
        )}
      </p>

      {/* what a screen reader actually gets */}
      <p className="sr-only" aria-live="polite">
        {text}
      </p>
    </div>
  );
}
