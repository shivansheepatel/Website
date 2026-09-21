/** Registers the `@/…` resolve hook. Passed to node via `--import`. */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./alias-loader.mjs", pathToFileURL(`${import.meta.dirname}/`));
