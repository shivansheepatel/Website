/**
 * A minimal Node resolve hook that understands the `@/…` path alias from
 * `tsconfig.json`, so the pure logic in `src/lib` can be run and tested with
 * plain `node --experimental-strip-types` — no bundler, no test framework.
 *
 * Registered by `scripts/register-alias.mjs`. Used by `npm run check:engine`.
 */

import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = resolvePath(dirname(fileURLToPath(import.meta.url)), "../src");

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = resolvePath(SRC, specifier.slice(2));
    for (const candidate of [base, `${base}.ts`, `${base}.tsx`, resolvePath(base, "index.ts")]) {
      if (existsSync(candidate)) {
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
  }
  return nextResolve(specifier, context);
}
