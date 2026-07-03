import { describe, expect, it } from "vitest";
import { buildWebMcpManifest } from "../src/lib/webmcp";

describe("WebMCP manifest", () => {
  it("derives tool names from MCP definitions", () => {
    const manifest = buildWebMcpManifest("https://hulistmi.ai");
    expect(manifest.name).toBe("hulistmi.ai");
    expect(manifest.tools.map((tool) => tool.name)).toContain(
      "fetchHarmonyOSDocumentation",
    );
  });
});
