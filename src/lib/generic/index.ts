import { CATALOG_CATEGORY_KEYS, type CatalogName } from "../catalog-name";
import { fetchHarmonyDocumentPageData } from "../documents";
import { LABELS } from "../labels";
import type { Language } from "../language";
import { renderDocumentMarkdown } from "../render";
import type { HarmonyDocumentValue } from "../types";
import { generateHuaweiDocUrl } from "../url";

export async function fetchCatalogPageData(
  catalogName: CatalogName,
  path: string,
  language: Language,
  origin: string | undefined,
): Promise<HarmonyDocumentValue> {
  return fetchHarmonyDocumentPageData(catalogName, path, language, origin);
}

export function renderCatalogPageMarkdown(
  catalogName: CatalogName,
  value: HarmonyDocumentValue,
  path: string,
  language: Language,
  origin: string | undefined,
): string {
  return renderDocumentMarkdown(
    value,
    `${catalogName}/${path}`,
    LABELS[language][CATALOG_CATEGORY_KEYS[catalogName]],
    language,
    origin,
  );
}

export async function fetchAndRenderCatalogPage(
  catalogName: CatalogName,
  path: string,
  language: Language,
  origin: string | undefined,
): Promise<{ sourceUrl: string; content: string }> {
  const data = await fetchCatalogPageData(catalogName, path, language, origin);
  const content = renderCatalogPageMarkdown(
    catalogName,
    data,
    path,
    language,
    origin,
  );
  const sourceUrl = generateHuaweiDocUrl(path, language, catalogName);
  return { sourceUrl, content };
}
