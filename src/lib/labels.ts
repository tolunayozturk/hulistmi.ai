import type { Language } from "./language";

export interface LabelBundle {
  guidesCatalog: string;
  referencesCatalog: string;
  searchHeader: (query: string) => string;
  guidesCategory: string;
  referencesCategory: string;
  untitled: string;
}

export const LABELS: Record<Language, LabelBundle> = {
  en: {
    guidesCatalog: "HarmonyOS Guides Catalog",
    referencesCatalog: "HarmonyOS References Catalog",
    searchHeader: (query) => `HarmonyOS search: ${query}`,
    guidesCategory: "HarmonyOS Guides",
    referencesCategory: "HarmonyOS References",
    untitled: "Untitled",
  },
  cn: {
    guidesCatalog: "HarmonyOS 指南文档目录",
    referencesCatalog: "HarmonyOS 参考文档目录",
    searchHeader: (query) => `HarmonyOS 搜索：${query}`,
    guidesCategory: "HarmonyOS 指南",
    referencesCategory: "HarmonyOS 参考",
    untitled: "未命名",
  },
};
