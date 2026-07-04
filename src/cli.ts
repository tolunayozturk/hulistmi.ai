import { spawn } from "node:child_process";
import { parseCliArgs, resolveFetchEndpoint } from "./lib/cli-endpoints";
import { fetchGuidePageData, renderGuideMarkdown } from "./lib/guides";
import {
  fetchReferencePageData,
  renderReferenceMarkdown,
} from "./lib/reference";
import { renderSearchMarkdown, searchHarmonyOSDocs } from "./lib/search";
import { generateHuaweiDocUrl, splitDocsPath } from "./lib/url";

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const args = parseCliArgs(argv);
  if (args.command === "search") {
    const result = await searchHarmonyOSDocs(args.query, args.language);
    const output = args.json
      ? JSON.stringify(result, null, 2)
      : renderSearchMarkdown(result);
    process.stdout.write(`${output}\n`);
    return;
  }
  if (args.command === "fetch") {
    const { path, language } = resolveFetchEndpoint(args.input);
    const { catalogName, pagePath } = splitDocsPath(path);
    const sourceUrl = generateHuaweiDocUrl(pagePath, language, catalogName);
    if (catalogName === "harmonyos-guides") {
      const data = await fetchGuidePageData(pagePath, language);
      const content = renderGuideMarkdown(data, pagePath, language);
      const output = args.json
        ? JSON.stringify({ url: sourceUrl, content }, null, 2)
        : content;
      process.stdout.write(`${output}\n`);
    } else {
      const data = await fetchReferencePageData(pagePath, language);
      const content = renderReferenceMarkdown(data, pagePath, language);
      const output = args.json
        ? JSON.stringify({ url: sourceUrl, content }, null, 2)
        : content;
      process.stdout.write(`${output}\n`);
    }
    return;
  }
  if (args.command === "serve") {
    const child = spawn(
      "npm",
      ["run", "dev", "--", "--port", String(args.port ?? 8787)],
      { stdio: "inherit" },
    );
    child.on("exit", (code) => process.exit(code ?? 0));
    return;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(
      `hulistmi: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  });
}
