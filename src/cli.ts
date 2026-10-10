import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { parseCliArgs, resolveFetchEndpoint } from "./lib/cli-endpoints";
import { fetchAndRenderCatalogPage } from "./lib/generic";
import { parsePublicOrigin } from "./lib/origin";
import { renderSearchMarkdown, searchHarmonyOSDocs } from "./lib/search";
import { terminalSafe, terminalSafeJson } from "./lib/terminal";
import { splitDocsPath } from "./lib/url";

export async function main(argv = process.argv.slice(2)): Promise<void> {
  // Unset, the CLI names no origin: it runs on the user's machine, not a deployment.
  const origin = parsePublicOrigin(
    "HULISTMI_PUBLIC_ORIGIN",
    process.env.HULISTMI_PUBLIC_ORIGIN,
  );
  const args = parseCliArgs(argv);
  if (args.command === "search") {
    const result = await searchHarmonyOSDocs(args.query, args.language, origin);
    const output = args.json
      ? terminalSafeJson(result)
      : terminalSafe(renderSearchMarkdown(result));
    process.stdout.write(`${output}\n`);
    return;
  }
  if (args.command === "fetch") {
    const { path, language } = resolveFetchEndpoint(args.input);
    const { catalogName, pagePath } = splitDocsPath(path);
    const { sourceUrl, content } = await fetchAndRenderCatalogPage(
      catalogName,
      pagePath,
      language,
      origin,
    );
    const output = args.json
      ? terminalSafeJson({ url: sourceUrl, content })
      : terminalSafe(content);
    process.stdout.write(`${output}\n`);
    return;
  }
  if (args.command === "serve") {
    const child = spawn(
      "npm",
      [
        "run",
        "dev",
        "--",
        "--port",
        String(args.port ?? 8787),
        ...(origin ? ["--var", `PUBLIC_ORIGIN:${origin}`] : []),
      ],
      { stdio: "inherit" },
    );
    // Without this, a failed spawn (npm is npm.cmd on Windows, which spawn
    // without a shell cannot run) is an unhandled 'error' event with a stack.
    child.on("error", (error) => {
      console.error(
        `hulistmi: cannot start the dev server (${terminalSafe(error.message)}). Run \`npm run dev\` in a clone of the repository.`,
      );
      process.exit(1);
    });
    // Same as the launcher: pass on SIGTERM, and exit as the child did.
    const forward = () => child.kill("SIGTERM");
    process.on("SIGTERM", forward);
    child.on("exit", (code, signal) => {
      if (!signal) process.exit(code ?? 1);
      process.off("SIGTERM", forward);
      process.kill(process.pid, signal);
    });
    return;
  }
}

// pathToFileURL, not `file://${path}`: the URL percent-encodes spaces and uses
// forward slashes, so a plain string never matches on Windows or in a path with
// a space, and the CLI would exit without doing anything.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(
      // A parse error can quote the upstream body.
      `hulistmi: ${terminalSafe(error instanceof Error ? error.message : String(error))}`,
    );
    process.exit(1);
  });
}
