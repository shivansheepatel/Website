/**
 * Apply what a human approved.
 *
 *   node --experimental-strip-types scripts/engine/apply.mts
 *
 * Reads data/review-decisions.json (written by /admin/review, or by hand),
 * edits src/data/programs.ts, and clears the decisions file so the same
 * approval can never be applied twice.
 *
 * Deliberately a separate command from the crawl: an approval should be its
 * own commit, with its own diff, attributable to the person who made it.
 */
import { applyDecisions } from "./sink-git.mts";

const { added, updated, rejected } = await applyDecisions();

if (!added.length && !updated.length && !rejected.length) {
  console.log("No decisions to apply.");
} else {
  if (added.length) console.log(`Added ${added.length} listing(s): ${added.join(", ")}`);
  if (updated.length) console.log(`Updated ${updated.length} listing(s): ${updated.join(", ")}`);
  if (rejected.length) console.log(`Rejected ${rejected.length} proposal(s).`);
  console.log("\nRun `npx prettier --write src/data/programs.ts` then `npm run typecheck`.");
}
