import { describe, expect, it } from "vitest";
import {
  generateHuaweiDocUrl,
  huaweiUrlToPath,
  isValidHuaweiDocUrl,
  normalizeDocsPath,
  splitDocsPath,
} from "../src/lib/url";

describe("HarmonyOS URL utilities", () => {
  it("normalizes supported docs paths", () => {
    expect(normalizeDocsPath("/harmonyos-guides/start-overview/")).toBe(
      "harmonyos-guides/start-overview",
    );
    expect(
      splitDocsPath("harmonyos-references/js-apis-app-ability-uiability"),
    ).toEqual({
      catalogName: "harmonyos-references",
      pagePath: "js-apis-app-ability-uiability",
    });
  });

  it("maps Huawei docs URLs to service paths", () => {
    const source =
      "https://developer.huawei.com/consumer/en/doc/harmonyos-guides/start-overview";
    expect(isValidHuaweiDocUrl(source)).toBe(true);
    expect(huaweiUrlToPath(source)).toBe("harmonyos-guides/start-overview");
    expect(generateHuaweiDocUrl("harmonyos-guides/start-overview")).toBe(
      source,
    );
  });

  it("maps local Huawei-style docs paths to service paths", () => {
    expect(
      huaweiUrlToPath(
        "http://localhost:8787/consumer/en/doc/harmonyos-guides/pipwindow-overview",
      ),
    ).toBe("harmonyos-guides/pipwindow-overview");
  });
});
