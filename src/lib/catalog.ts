import { fetchHuaweiJson, NotFoundError, UpstreamSizeError } from "./fetch";
import { UPSTREAM_CONTRACT } from "./upstream-contract";

const MAX_CATALOG_ITEMS = 5_000;
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
  }>(request);
  if (data.code !== 0 && data.code !== "0")
    throw new Error("Huawei catalog response changed shape");
  const items = normalizeCatalogItems(data.value);
  if (countItems(items) > MAX_CATALOG_ITEMS)
    throw new UpstreamSizeError("Huawei catalog exceeded maximum item count");
  return { catalogName, language: "en", items };
}

function normalizeCatalogItems(value: unknown): HarmonyCatalogItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = item as Record<string, unknown>;
    return {
      title: String(record.title ?? record.name ?? record.label ?? "Untitled"),
      path: typeof record.fileName === "string" ? record.fileName : undefined,
      children: normalizeCatalogItems(record.children ?? record.childList),
    };
  });
}

function countItems(items: HarmonyCatalogItem[]): number {
  return items.reduce(
    (count, item) => count + 1 + countItems(item.children),
    0,
  );
}

export function renderCatalogMarkdown(catalog: HarmonyCatalog): string {
  const title =
    catalog.catalogName === "harmonyos-guides"
      ? "HarmonyOS Guides Catalog"
      : "HarmonyOS References Catalog";
  const lines = [`# ${title}`, ""];
  for (const item of catalog.items)
    lines.push(`- ${item.title}${item.path ? `: ${item.path}` : ""}`);
  return lines.join("\n");
}
