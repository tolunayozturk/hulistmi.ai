import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchHarmonyOSCatalog } from "../src/lib/catalog";
import { fetchHuaweiJson } from "../src/lib/fetch";

vi.mock("../src/lib/fetch", () => ({
  fetchHuaweiJson: vi.fn(),
  NotFoundError: class NotFoundError extends Error {},
  UpstreamSizeError: class UpstreamSizeError extends Error {},
}));

const mockedFetchHuaweiJson = vi.mocked(fetchHuaweiJson);

describe("HarmonyOS catalog", () => {
  beforeEach(() => {
    mockedFetchHuaweiJson.mockReset();
  });

  it("normalizes catalogTreeList entries from the public catalog response", async () => {
    mockedFetchHuaweiJson.mockResolvedValueOnce({
      code: 0,
      value: {
        catalogTreeList: [
          {
            nodeName: "Quick Start",
            relateDocument: "quick-start",
            children: [
              {
                nodeName: "Preparations for Development",
                relateDocument: "start-overview",
                children: [],
              },
            ],
          },
        ],
      },
    });

    const catalog = await fetchHarmonyOSCatalog("harmonyos-guides");

    expect(catalog).toEqual(expect.objectContaining({ language: "en" }));
    expect(mockedFetchHuaweiJson.mock.calls[0][0].body).toMatchObject({
      catalogName: "harmonyos-guides",
      language: "en",
    });
    expect(catalog.items).toEqual([
      {
        title: "Quick Start",
        path: "quick-start",
        children: [
          {
            title: "Preparations for Development",
            path: "start-overview",
            children: [],
          },
        ],
      },
    ]);
  });

  it("threads language=cn into the upstream body and returns HarmonyCatalog.language=cn", async () => {
    mockedFetchHuaweiJson.mockResolvedValueOnce({
      code: 0,
      value: { catalogTreeList: [] },
    });

    const catalog = await fetchHarmonyOSCatalog("harmonyos-guides", "cn");

    expect(catalog.language).toBe("cn");
    expect(mockedFetchHuaweiJson.mock.calls[0][0].body).toMatchObject({
      catalogName: "harmonyos-guides",
      language: "cn",
    });
  });
});
