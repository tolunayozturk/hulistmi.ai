import { huaweiUrlToPath, normalizeDocsPath } from "./url";

export type CliCommand =
  | { command: "fetch"; input: string; json: boolean }
  | { command: "search"; query: string; json: boolean }
  | { command: "serve"; port?: number };

export function resolveFetchEndpoint(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Fetch input cannot be empty");
  if (/^https?:\/\//i.test(trimmed)) return `/${huaweiUrlToPath(trimmed)}`;
  return `/${normalizeDocsPath(trimmed)}`;
}

export function resolveSearchEndpoint(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) throw new Error("Search query cannot be empty");
  return `/search?q=${encodeURIComponent(trimmed)}`;
}

export function parseCliArgs(argv: string[]): CliCommand {
  const [command, ...rest] = argv;
  const json = rest.includes("--json");
  const values = rest.filter((value) => value !== "--json");

  if (command === "fetch") {
    const input = values[0];
    if (!input) throw new Error("Usage: hulistmi fetch <url-or-path> [--json]");
    return { command, input, json };
  }
  if (command === "search") {
    const query = values.join(" ");
    if (!query) throw new Error("Usage: hulistmi search <query> [--json]");
    return { command, query, json };
  }
  if (command === "serve") {
    const portFlag = values.indexOf("--port");
    const port = portFlag >= 0 ? Number(values[portFlag + 1]) : undefined;
    return { command, port };
  }
  throw new Error(
    "Usage: hulistmi fetch <url-or-path> [--json] | hulistmi search <query> [--json] | hulistmi serve [--port 8787]",
  );
}
