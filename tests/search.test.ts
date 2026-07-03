import { describe, expect, it, vi } from "vitest";
import { searchHarmonyOSDocs } from "../src/lib/search";

vi.mock("../src/lib/fetch", () => ({
  fetchHuaweiJson: vi.fn(async () => ({
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
  })),
}));

describe("HarmonyOS search", () => {
  it("validates query length and normalizes results", async () => {
    await expect(searchHarmonyOSDocs("")).rejects.toThrow(
      "Search query is required",
    );
    await expect(searchHarmonyOSDocs("x".repeat(121))).rejects.toThrow(
      "Search query is too long",
    );

    const result = await searchHarmonyOSDocs("UIAbility");
    expect(result.query).toBe("UIAbility");
    expect(result.results[0]).toMatchObject({
      title: "UIAbility",
      url: "https://developer.huawei.com/consumer/en/doc/harmonyos-references/js-apis-app-ability-uiability",
      type: "documentation",
    });
  });
});
