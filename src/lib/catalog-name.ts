// When Huawei promotes V6+ (returns code 92520013 / 目录不存在 from getCatalogTree),
// update the catalog names in CatalogName, SUPPORTED_CATALOGS,
// the catalog/document entries in upstream-contract.json, and the public/SKILL.md +
// public/llms.txt caveats. See AGENTS.md "Version-bound catalogs".
export type CatalogName =
  | "harmonyos-guides"
  | "harmonyos-references"
  | "harmonyos-releases"
  | "design-guides"
  | "best-practices";

export const SUPPORTED_CATALOGS: readonly CatalogName[] = [
  "harmonyos-guides",
  "harmonyos-references",
  "harmonyos-releases",
  "design-guides",
  "best-practices",
];

const SUPPORTED_CATALOGS_SET: ReadonlySet<CatalogName> = new Set(
  SUPPORTED_CATALOGS,
);

export function isCatalogName(value: string): value is CatalogName {
  return SUPPORTED_CATALOGS_SET.has(value as CatalogName);
}

export type CatalogCategoryKey =
  | "guidesCategory"
  | "referencesCategory"
  | "releasesCategory"
  | "designCategory"
  | "bestPracticesCategory";

export const CATALOG_CATEGORY_KEYS: Record<CatalogName, CatalogCategoryKey> = {
  "harmonyos-guides": "guidesCategory",
  "harmonyos-references": "referencesCategory",
  "harmonyos-releases": "releasesCategory",
  "design-guides": "designCategory",
  "best-practices": "bestPracticesCategory",
};

export type CatalogTitleKey =
  | "guidesCatalog"
  | "referencesCatalog"
  | "releasesCatalog"
  | "designCatalog"
  | "bestPracticesCatalog";

export const CATALOG_TITLE_KEYS: Record<CatalogName, CatalogTitleKey> = {
  "harmonyos-guides": "guidesCatalog",
  "harmonyos-references": "referencesCatalog",
  "harmonyos-releases": "releasesCatalog",
  "design-guides": "designCatalog",
  "best-practices": "bestPracticesCatalog",
};
