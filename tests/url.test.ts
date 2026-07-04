import { describe, expect, it } from "vitest";
import {
  generateHuaweiDocUrl,
  huaweiUrlLanguage,
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

  it("maps Huawei docs URLs to service paths (en)", () => {
    const source =
      "https://developer.huawei.com/consumer/en/doc/harmonyos-guides/start-overview";
    expect(isValidHuaweiDocUrl(source)).toBe(true);
    expect(huaweiUrlToPath(source)).toBe("harmonyos-guides/start-overview");
    expect(huaweiUrlLanguage(source)).toBe("en");
    expect(generateHuaweiDocUrl("harmonyos-guides/start-overview")).toBe(
      source,
    );
  });

  it("maps Huawei docs URLs to service paths (cn)", () => {
    const source =
      "https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/start-overview";
    expect(isValidHuaweiDocUrl(source)).toBe(true);
    expect(huaweiUrlToPath(source)).toBe("harmonyos-guides/start-overview");
    expect(huaweiUrlLanguage(source)).toBe("cn");
    expect(
      huaweiUrlLanguage(
        "https://developer.huawei.com/consumer/en/doc/harmonyos-guides/start-overview",
      ),
    ).toBe("en");
    expect(generateHuaweiDocUrl("harmonyos-guides/start-overview", "cn")).toBe(
      source,
    );
    expect(
      isValidHuaweiDocUrl("https://developer.huawei.com/consumer/zh/doc/x"),
    ).toBe(false);
  });

  it("maps local Huawei-style docs paths to service paths", () => {
    expect(
      huaweiUrlToPath(
        "http://localhost:8787/consumer/en/doc/harmonyos-guides/pipwindow-overview",
      ),
    ).toBe("harmonyos-guides/pipwindow-overview");
    expect(
      huaweiUrlToPath(
        "http://localhost:8787/consumer/cn/doc/harmonyos-guides/pipwindow-overview",
      ),
    ).toBe("harmonyos-guides/pipwindow-overview");
    expect(
      huaweiUrlLanguage(
        "http://localhost:8787/consumer/cn/doc/harmonyos-guides/pipwindow-overview",
      ),
    ).toBe("cn");
  });
});

describe("generateHuaweiDocUrl with explicit catalogName", () => {
  it("builds a full Huawei doc URL from path parts + catalog (en)", () => {
    expect(
      generateHuaweiDocUrl("start-overview", "en", "harmonyos-guides"),
    ).toBe(
      "https://developer.huawei.com/consumer/en/doc/harmonyos-guides/start-overview",
    );
  });
  it("builds a full Huawei doc URL from path parts + catalog (cn)", () => {
    expect(
      generateHuaweiDocUrl("start-overview", "cn", "harmonyos-guides"),
    ).toBe(
      "https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/start-overview",
    );
  });
});
