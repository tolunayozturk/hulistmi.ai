import { describe, expect, it } from "vitest";
import { z } from "zod";
import { SUPPORTED_CATALOGS } from "../src/lib/catalog-name";
import {
  FETCH_CATALOG_INPUT_SCHEMA,
  FETCH_DOC_INPUT_SCHEMA,
  MCP_SERVER_INFO,
  SEARCH_INPUT_SCHEMA,
  TOOL_DEFINITIONS,
} from "../src/lib/mcp";
import { VERSION } from "../src/lib/version";

describe("MCP tool metadata", () => {
  it("exposes HarmonyOS tools", () => {
    expect(MCP_SERVER_INFO.name).toBe("hulistmi.ai");
    expect(Object.keys(TOOL_DEFINITIONS)).toEqual([
      "searchHarmonyOSDocumentation",
      "fetchHarmonyOSDocumentation",
      "fetchHarmonyOSCatalog",
    ]);
    expect(MCP_SERVER_INFO.version).toBe(VERSION);
  });

  it("input schemas accept language: 'cn' explicitly", () => {
    expect(
      z.object(SEARCH_INPUT_SCHEMA).parse({
        query: "UIAbility",
        language: "cn",
      }),
    ).toMatchObject({ query: "UIAbility", language: "cn" });
    expect(
      z.object(FETCH_DOC_INPUT_SCHEMA).parse({
        path: "harmonyos-guides/x",
        language: "cn",
      }),
    ).toMatchObject({ path: "harmonyos-guides/x", language: "cn" });
    expect(
      z.object(FETCH_CATALOG_INPUT_SCHEMA).parse({
        catalogName: "harmonyos-guides",
        language: "cn",
      }),
    ).toMatchObject({ catalogName: "harmonyos-guides", language: "cn" });
  });

  it("input schemas default language to 'en' when omitted", () => {
    expect(
      z.object(SEARCH_INPUT_SCHEMA).parse({ query: "UIAbility" }),
    ).toMatchObject({ language: "en" });
    expect(
      z.object(FETCH_DOC_INPUT_SCHEMA).parse({ path: "harmonyos-guides/x" }),
    ).toMatchObject({ language: "en" });
    expect(
      z.object(FETCH_CATALOG_INPUT_SCHEMA).parse({
        catalogName: "harmonyos-guides",
      }),
    ).toMatchObject({ language: "en" });
  });

  it("fetchHarmonyOSCatalog catalogName enum accepts every supported catalog", () => {
    for (const catalogName of SUPPORTED_CATALOGS) {
      expect(
        z.object(FETCH_CATALOG_INPUT_SCHEMA).parse({ catalogName }),
      ).toMatchObject({ catalogName, language: "en" });
    }
  });

  it("fetchHarmonyOSCatalog catalogName enum rejects an unknown catalog", () => {
    expect(() =>
      z.object(FETCH_CATALOG_INPUT_SCHEMA).parse({ catalogName: "bogus" }),
    ).toThrow();
  });

  it("fetchHarmonyOSCatalog catalogName enum defaults to harmonyos-guides", () => {
    expect(z.object(FETCH_CATALOG_INPUT_SCHEMA).parse({})).toMatchObject({
      catalogName: "harmonyos-guides",
    });
  });

  it("fetchHarmonyOSDocumentation path accepts any of the 5 catalog prefixes", () => {
    for (const catalogName of SUPPORTED_CATALOGS) {
      const path = `${catalogName}/some-slug`;
      expect(z.object(FETCH_DOC_INPUT_SCHEMA).parse({ path })).toMatchObject({
        path,
        language: "en",
      });
    }
  });
});
