import { describe, expect, it } from "vitest";
import { MCP_SERVER_INFO, TOOL_DEFINITIONS } from "../src/lib/mcp";

describe("MCP tool metadata", () => {
  it("exposes HarmonyOS tools", () => {
    expect(MCP_SERVER_INFO.name).toBe("hulistmi.ai");
    expect(Object.keys(TOOL_DEFINITIONS)).toEqual([
      "searchHarmonyOSDocumentation",
      "fetchHarmonyOSDocumentation",
      "fetchHarmonyOSCatalog",
    ]);
  });
});
