import { spawn } from "node:child_process";
import {
  parseCliArgs,
  resolveFetchEndpoint,
  resolveSearchEndpoint,
} from "./lib/cli-endpoints";

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const args = parseCliArgs(argv);
  if (args.command === "search")
    return printWorkerResponse(resolveSearchEndpoint(args.query), args.json);
  if (args.command === "fetch")
    return printWorkerResponse(resolveFetchEndpoint(args.input), args.json);
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

async function printWorkerResponse(
  endpoint: string,
  json: boolean,
): Promise<void> {
  const { default: app } = await import("./index");
  const response = await app.request(endpoint, {
    headers: { Accept: json ? "application/json" : "text/markdown" },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text);
  process.stdout.write(`${text}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(
      `hulistmi: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  });
}
