import {
  Atom,
  Briefcase,
  Stethoscope,
  Scale,
  Compass,
  Palette,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/data/programs";

/**
 * Category colour and icon. The chip classes carry a 2px ink border to match
 * the arcade sticker treatment used everywhere else.
 */
export const CATEGORY_META: Record<
  Category,
  { chip: string; dot: string; text: string; icon: LucideIcon }
> = {
  STEM: {
    chip: "bg-cat-stem/12 text-cat-stem border-cat-stem/40",
    dot: "bg-cat-stem",
    text: "text-cat-stem",
    icon: Atom,
  },
  Business: {
    chip: "bg-cat-business/12 text-cat-business border-cat-business/40",
    dot: "bg-cat-business",
    text: "text-cat-business",
    icon: Briefcase,
  },
  Medicine: {
    chip: "bg-cat-medicine/12 text-cat-medicine border-cat-medicine/40",
    dot: "bg-cat-medicine",
    text: "text-cat-medicine",
    icon: Stethoscope,
  },
  "Law & Civics": {
    chip: "bg-cat-civics/12 text-cat-civics border-cat-civics/40",
    dot: "bg-cat-civics",
    text: "text-cat-civics",
    icon: Scale,
  },
  Leadership: {
    chip: "bg-cat-leadership/12 text-cat-leadership border-cat-leadership/40",
    dot: "bg-cat-leadership",
    text: "text-cat-leadership",
    icon: Compass,
  },
  Arts: {
    chip: "bg-cat-arts/12 text-cat-arts border-cat-arts/40",
    dot: "bg-cat-arts",
    text: "text-cat-arts",
    icon: Palette,
  },
};
