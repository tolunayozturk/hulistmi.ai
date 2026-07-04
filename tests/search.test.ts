import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderSearchMarkdown, searchHarmonyOSDocs } from "../src/lib/search";

const searchMock = vi.fn(async () => ({
  searchResult: [
    {
      developerInfos: [
        {
          name: "UIAbility",
          url: "/consumer/en/doc/harmonyos-references/js-apis-app-ability-uiability",
          description: "Ability lifecycle",
          ext: JSON.stringify({ domain: "HarmonyOS", nextSubType: "API" }),
        },
      ],
    },
  ],
}));

vi.mock("../src/lib/fetch", () => ({
  fetchHuaweiJson: (...args: unknown[]) => searchMock(...args),
}));

describe("HarmonyOS search", () => {
  beforeEach(() => {
    searchMock.mockClear();
  });

  it("validates query length and normalizes results", async () => {
    await expect(searchHarmonyOSDocs("")).rejects.toThrow(
      "Search query is required",
    );
    await expect(searchHarmonyOSDocs("x".repeat(121))).rejects.toThrow(
      "Search query is too long",
    );

    const result = await searchHarmonyOSDocs("UIAbility");
    expect(result.query).toBe("UIAbility");
    expect(result.language).toBe("en");
    expect(result.results[0]).toMatchObject({
      title: "UIAbility",
      url: "https://developer.huawei.com/consumer/en/doc/harmonyos-references/js-apis-app-ability-uiability",
      type: "documentation",
    });
    expect(searchMock.mock.calls[0][0].body).toMatchObject({
      language: "en",
      developerVertical: { language: "en" },
    });
  });

  it("threads language=cn into the upstream body (top-level only; developerVertical.language stays 'en' as the populated vertical)", async () => {
    const result = await searchHarmonyOSDocs("UIAbility", "cn");
    expect(result.language).toBe("cn");
    expect(searchMock.mock.calls[0][0].body).toMatchObject({
      language: "cn",
      keyWord: "UIAbility",
      developerVertical: { language: "en" },
    });
    expect(renderSearchMarkdown(result)).toContain("HarmonyOS 搜索：UIAbility");
  });
});
