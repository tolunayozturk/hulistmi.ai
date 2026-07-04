import { describe, expect, it } from "vitest";
import { z } from "zod";
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
});
