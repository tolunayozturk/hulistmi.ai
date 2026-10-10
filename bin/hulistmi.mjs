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
  // No shell: process.execPath is node itself. On Windows a shell joins the
  // arguments into a cmd.exe line unescaped, so a URL with "&" would run commands.
  { cwd: packageRoot, stdio: "inherit" },
);

child.on("exit", (code) => process.exit(code ?? 0));
