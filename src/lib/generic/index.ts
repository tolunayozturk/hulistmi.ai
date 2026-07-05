import { CATALOG_CATEGORY_KEYS, type CatalogName } from "../catalog-name";
import { fetchHarmonyDocumentPageData } from "../documents";
import { LABELS } from "../labels";
import { DEFAULT_LANGUAGE, type Language } from "../language";
import { renderDocumentMarkdown } from "../render";
import type { HarmonyDocumentValue } from "../types";
import { generateHuaweiDocUrl } from "../url";

export async function fetchCatalogPageData(
  catalogName: CatalogName,
  path: string,
  language: Language = DEFAULT_LANGUAGE,
): Promise<HarmonyDocumentValue> {
  return fetchHarmonyDocumentPageData(catalogName, path, language);
}

export function renderCatalogPageMarkdown(
  catalogName: CatalogName,
  value: HarmonyDocumentValue,
  path: string,
  language: Language = DEFAULT_LANGUAGE,
): string {
  return renderDocumentMarkdown(
    value,
    `${catalogName}/${path}`,
    LABELS[language][CATALOG_CATEGORY_KEYS[catalogName]],
    language,
  );
}

export async function fetchAndRenderCatalogPage(
  catalogName: CatalogName,
  path: string,
  language: Language = DEFAULT_LANGUAGE,
): Promise<{ sourceUrl: string; content: string }> {
  const data = await fetchCatalogPageData(catalogName, path, language);
  const content = renderCatalogPageMarkdown(catalogName, data, path, language);
  const sourceUrl = generateHuaweiDocUrl(path, language, catalogName);
  return { sourceUrl, content };
}
