#!/usr/bin/env node
/**
 * Regenerate `src/routeTree.gen.ts` without running a full Vite build.
 *
 * The dev server and `npm run build` both regenerate this file automatically,
 * so you rarely need this. It exists for two cases: a fresh clone where you
 * want types before installing native build toolchains, and CI typechecking
 * that runs `tsc` without bundling.
 *
 * Do not edit routeTree.gen.ts by hand — add a file under src/routes/ instead.
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import { Generator, getConfig } from "@tanstack/router-generator";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "src/routeTree.gen.ts");

const config = getConfig(
  {
    target: "react",
    routesDirectory: "./src/routes",
    generatedRouteTree: "./src/routeTree.gen.ts",
    routeFileIgnorePattern: "README.md",
    quoteStyle: "single",
    semicolons: false,
    verboseFileRoutes: false,
  },
  ROOT,
);

await new Generator({ config, root: ROOT }).run();

/**
 * The standalone generator omits the TanStack Start `Register` block that the
 * Vite plugin appends. Re-add it so `tsc` sees the same types either way.
 */
const REGISTER_BLOCK = `
import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
`;

const current = await readFile(OUT, "utf8");
if (!current.includes("interface Register")) {
  await writeFile(OUT, `${current.trimEnd()}\n${REGISTER_BLOCK}`, "utf8");
}

console.log("Route tree regenerated.");
