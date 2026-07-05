import { describe, expect, it } from "vitest";
import { LABELS } from "../src/lib/labels";

describe("i18n labels", () => {
  it("covers both languages with the required keys", () => {
    expect(LABELS.en).toEqual(
      expect.objectContaining({
        guidesCatalog: expect.any(String),
        referencesCatalog: expect.any(String),
        guidesCategory: expect.any(String),
        referencesCategory: expect.any(String),
        untitled: expect.any(String),
      }),
    );
    expect(LABELS.cn).toEqual(
      expect.objectContaining({
        guidesCatalog: expect.any(String),
        referencesCatalog: expect.any(String),
        guidesCategory: expect.any(String),
        referencesCategory: expect.any(String),
        untitled: expect.any(String),
      }),
    );
  });

  it("renders en search header as 'HarmonyOS search: <query>'", () => {
    expect(LABELS.en.searchHeader("UIAbility")).toBe(
      "HarmonyOS search: UIAbility",
    );
  });

  it("renders cn search header with a full-width colon", () => {
    expect(LABELS.cn.searchHeader("UIAbility")).toBe(
      "HarmonyOS 搜索：UIAbility",
    );
  });

  it("matches expected snapshot per language", () => {
    expect({
      ...LABELS.en,
      searchHeader: "HarmonyOS search: q",
    }).toEqual(
      expect.objectContaining({
        guidesCatalog: "HarmonyOS Guides Catalog",
        guidesCategory: "HarmonyOS Guides",
        referencesCatalog: "HarmonyOS References Catalog",
        referencesCategory: "HarmonyOS References",
        releasesCatalog: "HarmonyOS Release Notes Catalog",
        releasesCategory: "HarmonyOS Release Notes",
        designCatalog: "HarmonyOS Design Catalog",
        designCategory: "HarmonyOS Design",
        bestPracticesCatalog: "HarmonyOS Best Practices Catalog",
        bestPracticesCategory: "HarmonyOS Best Practices",
        searchHeader: "HarmonyOS search: q",
        untitled: "Untitled",
      }),
    );
    expect({
      ...LABELS.cn,
      searchHeader: "HarmonyOS 搜索：q",
    }).toEqual(
      expect.objectContaining({
        guidesCatalog: "HarmonyOS 指南文档目录",
        guidesCategory: "HarmonyOS 指南",
        referencesCatalog: "HarmonyOS 参考文档目录",
        referencesCategory: "HarmonyOS 参考",
        releasesCatalog: "HarmonyOS 版本说明目录",
        releasesCategory: "HarmonyOS 版本说明",
        designCatalog: "HarmonyOS 设计文档目录",
        designCategory: "HarmonyOS 设计",
        bestPracticesCatalog: "HarmonyOS 最佳实践目录",
        bestPracticesCategory: "HarmonyOS 最佳实践",
        searchHeader: "HarmonyOS 搜索：q",
        untitled: "未命名",
      }),
    );
  });
});
