import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const dest = resolve(root, "src/lib/version.ts");

writeFileSync(
  dest,
  `export const VERSION = ${JSON.stringify(pkg.version)};\n`,
  "utf8",
);

console.log(`synced src/lib/version.ts -> ${pkg.version}`);
