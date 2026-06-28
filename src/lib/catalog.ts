import { fetchHuaweiJson, NotFoundError, UpstreamSizeError } from "./fetch";
import { UPSTREAM_CONTRACT } from "./upstream-contract";

const MAX_CATALOG_ITEMS = 20_000;
const MAX_CATALOG_UPSTREAM_BYTES = 5_000_000;
const SUPPORTED_CATALOGS = new Set([
  "harmonyos-guides",
  "harmonyos-references",
]);

export interface HarmonyCatalogItem {
  title: string;
  path?: string;
  children: HarmonyCatalogItem[];
}

export interface HarmonyCatalog {
  catalogName: string;
  language: "en";
  items: HarmonyCatalogItem[];
}

export async function fetchHarmonyOSCatalog(
  catalogName: string,
  language = "en",
): Promise<HarmonyCatalog> {
  if (!SUPPORTED_CATALOGS.has(catalogName))
    throw new NotFoundError("Unsupported HarmonyOS catalog");
  if (language !== "en")
    throw new Error("Unsupported HarmonyOS catalog language");
  const request =
    UPSTREAM_CONTRACT.catalogs[
      catalogName as keyof typeof UPSTREAM_CONTRACT.catalogs
    ].request;
  const data = await fetchHuaweiJson<{
    code: number | string;
    value?: unknown;
  }>(request, MAX_CATALOG_UPSTREAM_BYTES);
  if (data.code !== 0 && data.code !== "0")
    throw new Error("Huawei catalog response changed shape");
  const items = normalizeCatalogItems(data.value);
  if (countItems(items) > MAX_CATALOG_ITEMS)
    throw new UpstreamSizeError("Huawei catalog exceeded maximum item count");
  return { catalogName, language: "en", items };
}

function normalizeCatalogItems(value: unknown): HarmonyCatalogItem[] {
  const source = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.catalogTreeList)
      ? value.catalogTreeList
      : [];
  if (!Array.isArray(source)) return [];
  return source.map((item) => {
    const record = item as Record<string, unknown>;
    return {
      title: String(
        record.nodeName ??
          record.title ??
          record.name ??
          record.label ??
          "Untitled",
      ),
      path:
        typeof record.relateDocument === "string"
          ? record.relateDocument
          : typeof record.fileName === "string"
            ? record.fileName
            : undefined,
      children: normalizeCatalogItems(record.children ?? record.childList),
    };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function countItems(items: HarmonyCatalogItem[]): number {
  return items.reduce(
    (count, item) => count + 1 + countItems(item.children),
    0,
  );
}

function renderTreeItems(
  items: HarmonyCatalogItem[],
  depth: number,
  maxDepth: number | undefined,
): string[] {
  if (!items.length || (maxDepth !== undefined && depth > maxDepth)) return [];
  const lines: string[] = [];
  for (const item of items) {
    const indent = "  ".repeat(depth - 1);
    lines.push(`${indent}- ${item.title}${item.path ? `: ${item.path}` : ""}`);
    if (item.children.length)
      lines.push(...renderTreeItems(item.children, depth + 1, maxDepth));
  }
  return lines;
}

export function renderCatalogMarkdown(
  catalog: HarmonyCatalog,
  maxDepth?: number,
): string {
  const title =
    catalog.catalogName === "harmonyos-guides"
      ? "HarmonyOS Guides Catalog"
      : "HarmonyOS References Catalog";
  const lines = [`# ${title}`, ""];
  lines.push(...renderTreeItems(catalog.items, 1, maxDepth));
  return lines.join("\n");
}
