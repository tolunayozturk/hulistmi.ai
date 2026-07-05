import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchHarmonyOSCatalog,
  renderCatalogMarkdown,
} from "../src/lib/catalog";
import {
  CATALOG_TITLE_KEYS,
  type CatalogName,
  SUPPORTED_CATALOGS,
} from "../src/lib/catalog-name";
import { fetchHuaweiJson } from "../src/lib/fetch";
import { LABELS } from "../src/lib/labels";
import type { Language } from "../src/lib/language";

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

  it("renderCatalogMarkdown uses the correct H1 from CATALOG_TITLE_KEYS for every supported catalog (en+cn)", () => {
    const emptyCatalog = {
      catalogName: "harmonyos-guides" as CatalogName,
      language: "en" as Language,
      items: [],
    };
    for (const catalogName of SUPPORTED_CATALOGS) {
      for (const language of ["en", "cn"] as const) {
        emptyCatalog.catalogName = catalogName;
        emptyCatalog.language = language;
        const rendered = renderCatalogMarkdown(emptyCatalog);
        const expectedH1 = LABELS[language][CATALOG_TITLE_KEYS[catalogName]];
        expect(rendered.split("\n", 1)[0]).toBe(`# ${expectedH1}`);
      }
    }
  });
});
