import { type CatalogName, SUPPORTED_CATALOGS } from "./catalog-name";
import { ValidationError } from "./fetch";
import { DEFAULT_LANGUAGE, docPrefix, type Language } from "./language";

export const HUAWEI_DOC_ORIGIN = "https://developer.huawei.com";

export function normalizeDocsPath(path: string): string {
  return path.trim().replace(/^\/+/, "").replace(/\/+$/, "");
}

function matchDocPrefix(
  input: string,
): { lang: Language; rest: string } | null {
  for (const lang of ["en", "cn"] as const) {
    const prefix = docPrefix(lang);
    if (input.startsWith(prefix))
      return { lang, rest: input.slice(prefix.length) };
  }
  return null;
}

export function generateHuaweiDocUrl(
  path: string,
  language: Language = DEFAULT_LANGUAGE,
  catalogName?: string,
): string {
  const tail = catalogName
    ? `${normalizeDocsPath(catalogName)}/${normalizeDocsPath(path)}`
    : normalizeDocsPath(path);
  return `${HUAWEI_DOC_ORIGIN}${docPrefix(language)}${tail}`;
}

export function resolveHuaweiDocUrl(raw: string | undefined): string {
  if (!raw) return HUAWEI_DOC_ORIGIN;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  return `${HUAWEI_DOC_ORIGIN}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

export function isValidHuaweiDocUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return (
      url.protocol === "https:" &&
      url.hostname === "developer.huawei.com" &&
      matchDocPrefix(url.pathname) !== null
    );
  } catch {
    return false;
  }
}

export function huaweiUrlToPath(input: string): string {
  const url = new URL(input);
  const match = matchDocPrefix(url.pathname);
  if (!match)
    throw new ValidationError(`Unsupported Huawei documentation URL: ${input}`);
  return normalizeDocsPath(match.rest);
}

export function huaweiUrlLanguage(input: string): Language {
  const url = new URL(input);
  const match = matchDocPrefix(url.pathname);
  if (!match)
    throw new ValidationError(`Unsupported Huawei documentation URL: ${input}`);
  return match.lang;
}

export function splitDocsPath(path: string): {
  catalogName: CatalogName;
  pagePath: string;
} {
  const normalized = normalizeDocsPath(path);
  for (const catalogName of SUPPORTED_CATALOGS) {
    const prefix = `${catalogName}/`;
    if (normalized.startsWith(prefix)) {
      return {
        catalogName,
        pagePath: normalized.slice(prefix.length),
      };
    }
  }
  throw new ValidationError(
    `Unsupported HarmonyOS documentation path: ${path}`,
  );
}
