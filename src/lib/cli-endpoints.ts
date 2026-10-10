import { ValidationError } from "./fetch";
import type { Language } from "./language";
import { parseDocsInput } from "./url";

export type CliCommand =
  | {
      command: "fetch";
      input: string;
      language: Language;
      json: boolean;
    }
  | { command: "search"; query: string; language: Language; json: boolean }
  | { command: "serve"; port?: number };

export interface ResolvedFetchEndpoint {
  path: string;
  language: Language;
}

export function resolveFetchEndpoint(input: string): ResolvedFetchEndpoint {
  const trimmed = input.trim();
  if (!trimmed) throw new ValidationError("Fetch input cannot be empty");
  // The CLI takes no --language for fetch, so the input must carry the language.
  const { path, language } = parseDocsInput(trimmed);
  if (!language)
    throw new ValidationError(
      `Input must be a full Huawei doc URL or /consumer/{en|cn}/doc/<catalog>/<path> — got: ${input}`,
    );
  return { path, language };
}

export function resolveSearchEndpoint(
  query: string,
  language: Language,
): string {
  const trimmed = query.trim();
  if (!trimmed) throw new ValidationError("Search query cannot be empty");
  return `/search?q=${encodeURIComponent(trimmed)}&language=${language}`;
}

const VALUE_FLAGS = new Map<string, string>([
  ["--language", "en"],
  ["-l", "en"],
]);
const VALUE_FLAG_NAMES = new Set(VALUE_FLAGS.keys());

function parseLanguageValue(raw: string): Language {
  if (raw !== "en" && raw !== "cn")
    throw new ValidationError(
      `Unsupported language: ${raw} (must be "en" or "cn")`,
    );
  return raw;
}

export function parseCliArgs(argv: string[]): CliCommand {
  const [command, ...rest] = argv;
  const json = rest.includes("--json");
  const jsonStripped = rest.filter((value) => value !== "--json");

  let language: Language | undefined;

  // Validate before warning, so the warning never echoes an unchecked value.
  function setLanguage(flag: string, raw: string): void {
    const parsed = parseLanguageValue(raw);
    if (language !== undefined)
      process.stderr.write(
        `warning: ${flag} ${parsed} overrides earlier --language/-l\n`,
      );
    language = parsed;
  }

  function takeValueFlag(flag: string, index: number): number {
    const next = jsonStripped[index + 1];
    if (next === undefined || next.startsWith("-"))
      throw new ValidationError(`Flag ${flag} requires a value`);
    setLanguage(flag, next);
    return 2;
  }

  const remaining: string[] = [];
  for (let i = 0; i < jsonStripped.length; ) {
    const token = jsonStripped[i];
    if (VALUE_FLAG_NAMES.has(token)) {
      i += takeValueFlag(token, i);
      continue;
    }
    const equalIdx = token.indexOf("=");
    if (equalIdx > 0) {
      const name = token.slice(0, equalIdx);
      if (VALUE_FLAG_NAMES.has(name)) {
        const value = token.slice(equalIdx + 1);
        if (value === "")
          throw new ValidationError(`Flag ${name}= requires a value`);
        setLanguage(name, value);
        i += 1;
        continue;
      }
    }
    remaining.push(token);
    i += 1;
  }

  if (command === "fetch") {
    const input = remaining[0];
    if (!input)
      throw new ValidationError("Usage: hulistmi fetch <url-or-path> [--json]");
    if (language !== undefined)
      throw new ValidationError(
        "The --language/-l flag is not supported for `fetch`; language is derived from the URL prefix.",
      );
    const { language: derived } = resolveFetchEndpoint(input);
    return {
      command,
      input,
      language: derived,
      json,
    };
  }
  if (command === "search") {
    const query = remaining.join(" ");
    if (!query)
      throw new ValidationError("Usage: hulistmi search <query> [--json]");
    return { command, query, language: language ?? "en", json };
  }
  if (command === "serve") {
    const portFlag = remaining.indexOf("--port");
    const port = portFlag >= 0 ? Number(remaining[portFlag + 1]) : undefined;
    return { command, port };
  }
  throw new ValidationError(
    "Usage: hulistmi fetch <url-or-path> [--json] | hulistmi search <query> [--language en|cn] [--json] | hulistmi serve [--port 8787]",
  );
}
