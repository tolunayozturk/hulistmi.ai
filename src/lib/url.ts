const HUAWEI_DOC_ORIGIN = "https://developer.huawei.com";
const DOC_PREFIX = "/consumer/en/doc/";

export function normalizeDocsPath(path: string): string {
  return path.trim().replace(/^\/+/, "").replace(/\/+$/, "");
}

export function generateHuaweiDocUrl(path: string): string {
  return `${HUAWEI_DOC_ORIGIN}${DOC_PREFIX}${normalizeDocsPath(path)}`;
}

export function isValidHuaweiDocUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return (
      url.protocol === "https:" &&
      url.hostname === "developer.huawei.com" &&
      url.pathname.startsWith(DOC_PREFIX)
    );
  } catch {
    return false;
  }
}

export function huaweiUrlToPath(input: string): string {
  const url = new URL(input);
  if (!url.pathname.startsWith(DOC_PREFIX))
    throw new Error(`Unsupported Huawei documentation URL: ${input}`);
  return normalizeDocsPath(url.pathname.slice(DOC_PREFIX.length));
}

export function splitDocsPath(path: string): {
  catalogName: "harmonyos-guides" | "harmonyos-references";
  pagePath: string;
} {
  const normalized = normalizeDocsPath(path);
  if (normalized.startsWith("harmonyos-guides/")) {
    return {
      catalogName: "harmonyos-guides",
      pagePath: normalized.slice("harmonyos-guides/".length),
    };
  }
  if (normalized.startsWith("harmonyos-references/")) {
    return {
      catalogName: "harmonyos-references",
      pagePath: normalized.slice("harmonyos-references/".length),
    };
  }
  throw new Error(`Unsupported HarmonyOS documentation path: ${path}`);
}
