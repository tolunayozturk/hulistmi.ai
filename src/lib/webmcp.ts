import { TOOL_DEFINITIONS } from "./mcp";

export function buildWebMcpManifest(origin = "https://hulistmi.ai") {
  return {
    name: "hulistmi.ai",
    description: "AI-readable HarmonyOS documentation.",
    mcp: `${origin}/mcp`,
    tools: Object.entries(TOOL_DEFINITIONS).map(([name, definition]) => ({
      name,
      description: definition.description,
      http: {
        ...definition.http,
        path: definition.http.path
          ? `${origin}${definition.http.path}`
          : undefined,
      },
    })),
  };
}
