/**
 * ============================================================================
 *  BYTE — the companion mascot
 * ============================================================================
 *
 * A hand-drawn SVG sprite, not an image asset: it inherits the theme colours,
 * scales to any size without a second file, and costs nothing to ship. Renamed
 * or disabled from `config/site.ts`.
 *
 * Expressions are driven by data, never by a sprite sheet — each one swaps the
 * eye and mouth paths. That keeps the character honest: Byte gets excited when
 * a student picks something, thoughtful while they decide, and proud when they
 * finish, and every one of those is a prop the caller sets deliberately.
 */

import { motion, useReducedMotion } from "framer-motion";

import { MASCOT } from "@/config/site";
import { cn } from "@/lib/utils";

export type ByteMood = "idle" | "excited" | "thoughtful" | "encouraging" | "proud" | "curious";

const SIZES = { sm: 44, md: 72, lg: 104, xl: 140 } as const;

interface Props {
  mood?: ByteMood;
  size?: keyof typeof SIZES;
  /** Adds the idle float. Turn it off inside dense layouts. */
  float?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Expression parts                                                           */
/* -------------------------------------------------------------------------- */

function Eyes({ mood }: { mood: ByteMood }) {
  const stroke = "var(--mascot-deep)";

  if (mood === "thoughtful") {
    // one eye narrowed — the "hmm" face
    return (
      <>
        <path d="M22 30h9" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="45" cy="30" r="4.5" fill={stroke} className="animate-blink origin-center" />
      </>
    );
  }

  if (mood === "proud" || mood === "encouraging") {
    // happy arcs
    return (
      <>
        <path
          d="M21 32c2.5-5 7.5-5 10 0"
          stroke={stroke}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M40 32c2.5-5 7.5-5 10 0"
          stroke={stroke}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      </>
    );
  }

  if (mood === "excited") {
    // wide eyes with a highlight
    return (
      <>
        <circle cx="26" cy="30" r="6.5" fill={stroke} />
        <circle cx="45" cy="30" r="6.5" fill={stroke} />
        <circle cx="28.4" cy="27.6" r="2" fill="var(--card)" />
        <circle cx="47.4" cy="27.6" r="2" fill="var(--card)" />
      </>
    );
  }

  if (mood === "curious") {
    return (
      <>
        <circle cx="26" cy="30" r="5" fill={stroke} className="animate-blink origin-center" />
        <circle cx="46" cy="29" r="6" fill={stroke} />
        <circle cx="48" cy="27" r="1.9" fill="var(--card)" />
      </>
    );
  }

  return (
    <>
      <circle cx="26" cy="30" r="5" fill={stroke} className="animate-blink origin-center" />
      <circle cx="45" cy="30" r="5" fill={stroke} className="animate-blink origin-center" />
      <circle cx="27.8" cy="28.2" r="1.7" fill="var(--card)" />
      <circle cx="46.8" cy="28.2" r="1.7" fill="var(--card)" />
    </>
  );
}

function Mouth({ mood }: { mood: ByteMood }) {
  const stroke = "var(--mascot-deep)";
  const common = { stroke, strokeWidth: 3, strokeLinecap: "round" as const, fill: "none" };

  switch (mood) {
    case "excited":
      return (
        <path
          d="M28 41c2 6 13 6 15 0a8 8 0 0 1-15 0Z"
          fill={stroke}
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      );
    case "proud":
      return <path d="M27 40c3 6 14 6 17 0" {...common} strokeWidth="3.5" />;
    case "thoughtful":
      return <path d="M29 42c2-2 4 2 6 0s4 2 6 0" {...common} strokeWidth="2.6" />;
    case "curious":
      return <circle cx="35.5" cy="42" r="3.2" stroke={stroke} strokeWidth="2.6" fill="none" />;
    case "encouraging":
      return <path d="M28 41c3 4.5 12 4.5 15 0" {...common} />;
    default:
      return <path d="M30 41c2 3 9 3 11 0" {...common} />;
  }
}

/* -------------------------------------------------------------------------- */
/*  Sprite                                                                     */
/* -------------------------------------------------------------------------- */

export function Byte({ mood = "idle", size = "md", float = true, className }: Props) {
  const reduce = useReducedMotion();
  const px = SIZES[size];
  const lively = mood === "excited" || mood === "proud";

  return (
    <motion.div
      className={cn("relative shrink-0 select-none", className)}
      style={{ width: px, height: px }}
      {...(reduce || !float
        ? {}
        : {
            animate: { y: [0, -5, 0], rotate: lively ? [-2, 2, -2] : [-0.8, 0.8, -0.8] },
            transition: {
              duration: lively ? 1.6 : 3.2,
              repeat: Infinity,
              ease: "easeInOut" as const,
            },
          })}
      aria-hidden="true"
    >
      <svg viewBox="0 0 72 76" width={px} height={px} role="presentation">
        {/* antenna */}
        <path d="M36 12V5" stroke="var(--color-border)" strokeWidth="3" strokeLinecap="round" />
        <motion.circle
          cx="36"
          cy="4"
          r="4.5"
          fill="var(--accent)"
          stroke="var(--color-border)"
          strokeWidth="2.5"
          {...(reduce || !lively
            ? {}
            : {
                animate: { scale: [1, 1.22, 1] },
                transition: { duration: 0.85, repeat: Infinity, ease: "easeInOut" as const },
              })}
        />

        {/* side pins — the chip read */}
        {[24, 38, 52].map((y) => (
          <g key={y}>
            <rect
              x="1"
              y={y}
              width="7"
              height="5"
              rx="1.5"
              fill="var(--mascot-deep)"
              stroke="var(--color-border)"
              strokeWidth="2"
            />
            <rect
              x="64"
              y={y}
              width="7"
              height="5"
              rx="1.5"
              fill="var(--mascot-deep)"
              stroke="var(--color-border)"
              strokeWidth="2"
            />
          </g>
        ))}

        {/* body */}
        <rect
          x="7"
          y="12"
          width="58"
          height="52"
          rx="13"
          fill="var(--mascot)"
          stroke="var(--color-border)"
          strokeWidth="3"
        />
        {/* screen */}
        <rect
          x="14"
          y="19"
          width="44"
          height="32"
          rx="8"
          fill="var(--card)"
          stroke="var(--color-border)"
          strokeWidth="2.5"
        />

        <Eyes mood={mood} />
        <Mouth mood={mood} />

        {/* cheek blush on the warm moods */}
        {(mood === "excited" || mood === "proud" || mood === "encouraging") && (
          <>
            <ellipse cx="19.5" cy="38" rx="3.6" ry="2.4" fill="var(--coral)" opacity="0.55" />
            <ellipse cx="52.5" cy="38" rx="3.6" ry="2.4" fill="var(--coral)" opacity="0.55" />
          </>
        )}

        {/* control strip */}
        <rect x="21" y="55" width="12" height="4" rx="2" fill="var(--mascot-deep)" />
        <circle
          cx="45"
          cy="57"
          r="2.6"
          fill="var(--accent)"
          stroke="var(--color-border)"
          strokeWidth="1.6"
        />
        <circle
          cx="52"
          cy="57"
          r="2.6"
          fill="var(--coral)"
          stroke="var(--color-border)"
          strokeWidth="1.6"
        />

        {/* feet */}
        <rect
          x="16"
          y="63"
          width="14"
          height="8"
          rx="3.5"
          fill="var(--mascot-deep)"
          stroke="var(--color-border)"
          strokeWidth="2.5"
        />
        <rect
          x="42"
          y="63"
          width="14"
          height="8"
          rx="3.5"
          fill="var(--mascot-deep)"
          stroke="var(--color-border)"
          strokeWidth="2.5"
        />

        {/* sparkles when proud */}
        {mood === "proud" && (
          <>
            <path d="M64 14l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="var(--accent)" />
            <path
              d="M8 6l1.1 2.7L11.8 9.8 9.1 10.9 8 13.6 6.9 10.9 4.2 9.8 6.9 8.7z"
              fill="var(--accent)"
            />
          </>
        )}
      </svg>
    </motion.div>
  );
}

/** Byte's name, for copy that mentions the character. */
export const BYTE_NAME = MASCOT.name;
