import type { Language } from "./language";

export interface LabelBundle {
  guidesCatalog: string;
  referencesCatalog: string;
  releasesCatalog: string;
  designCatalog: string;
  bestPracticesCatalog: string;
  searchHeader: (query: string) => string;
  guidesCategory: string;
  referencesCategory: string;
  releasesCategory: string;
  designCategory: string;
  bestPracticesCategory: string;
  untitled: string;
}

export const LABELS: Record<Language, LabelBundle> = {
  en: {
    guidesCatalog: "HarmonyOS Guides Catalog",
    referencesCatalog: "HarmonyOS References Catalog",
    releasesCatalog: "HarmonyOS Release Notes Catalog",
    designCatalog: "HarmonyOS Design Catalog",
    bestPracticesCatalog: "HarmonyOS Best Practices Catalog",
    searchHeader: (query) => `HarmonyOS search: ${query}`,
    guidesCategory: "HarmonyOS Guides",
    referencesCategory: "HarmonyOS References",
    releasesCategory: "HarmonyOS Release Notes",
    designCategory: "HarmonyOS Design",
    bestPracticesCategory: "HarmonyOS Best Practices",
    untitled: "Untitled",
  },
  cn: {
    guidesCatalog: "HarmonyOS 指南文档目录",
    referencesCatalog: "HarmonyOS 参考文档目录",
    releasesCatalog: "HarmonyOS 版本说明目录",
    designCatalog: "HarmonyOS 设计文档目录",
    bestPracticesCatalog: "HarmonyOS 最佳实践目录",
    searchHeader: (query) => `HarmonyOS 搜索：${query}`,
    guidesCategory: "HarmonyOS 指南",
    referencesCategory: "HarmonyOS 参考",
    releasesCategory: "HarmonyOS 版本说明",
    designCategory: "HarmonyOS 设计",
    bestPracticesCategory: "HarmonyOS 最佳实践",
    untitled: "未命名",
  },
};
