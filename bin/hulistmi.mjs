#!/usr/bin/env node

import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, "..");
const cliPath = resolve(packageRoot, "src/cli.ts");

const child = spawn(
  process.execPath,
  ["--import", "tsx/esm", cliPath, ...process.argv.slice(2)],
  {
    cwd: packageRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

child.on("exit", (code) => process.exit(code ?? 0));
