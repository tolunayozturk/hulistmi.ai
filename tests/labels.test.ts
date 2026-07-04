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
    }).toMatchInlineSnapshot(`
      {
        "guidesCatalog": "HarmonyOS Guides Catalog",
        "guidesCategory": "HarmonyOS Guides",
        "referencesCatalog": "HarmonyOS References Catalog",
        "referencesCategory": "HarmonyOS References",
        "searchHeader": "HarmonyOS search: q",
        "untitled": "Untitled",
      }
    `);
    expect({
      ...LABELS.cn,
      searchHeader: "HarmonyOS 搜索：q",
    }).toMatchInlineSnapshot(`
      {
        "guidesCatalog": "HarmonyOS 指南文档目录",
        "guidesCategory": "HarmonyOS 指南",
        "referencesCatalog": "HarmonyOS 参考文档目录",
        "referencesCategory": "HarmonyOS 参考",
        "searchHeader": "HarmonyOS 搜索：q",
        "untitled": "未命名",
      }
    `);
  });
});
