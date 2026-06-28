import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchHarmonyOSCatalog, renderCatalogMarkdown } from "./catalog";
import { assertRenderedMarkdownWithinLimit } from "./fetch";
import { fetchGuidePageData, renderGuideMarkdown } from "./guides";
import { fetchReferencePageData, renderReferenceMarkdown } from "./reference";
import { renderSearchMarkdown, searchHarmonyOSDocs } from "./search";

export const MCP_SERVER_INFO = {
  name: "hulistmi.ai",
  version: "1.0.0",
} as const;

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

export const TOOL_DEFINITIONS = {
  searchHarmonyOSDocumentation: {
    description: "Search HarmonyOS developer documentation.",
    http: { path: "/search", query: { q: "query" } },
  },
  fetchHarmonyOSDocumentation: {
    description: "Fetch a HarmonyOS documentation page as Markdown.",
    http: { path: "/{path}", query: {} },
  },
  fetchHarmonyOSCatalog: {
    description: "Fetch a HarmonyOS documentation catalog.",
    http: {
      path: "/catalog",
      query: { catalogName: "catalogName", language: "language", depth: "depth" },
    },
  },
} as const;

export function createMcpServer(): McpServer {
  const server = new McpServer(MCP_SERVER_INFO);
  server.registerTool(
    "searchHarmonyOSDocumentation",
    {
      title: "Search HarmonyOS Documentation",
      description: TOOL_DEFINITIONS.searchHarmonyOSDocumentation.description,
      inputSchema: { query: z.string().min(1).max(120) },
      annotations: readOnlyAnnotations,
    },
    async ({ query }) => ({
      content: [
        {
          type: "text",
          text: assertRenderedMarkdownWithinLimit(
            renderSearchMarkdown(await searchHarmonyOSDocs(query)),
          ),
        },
      ],
    }),
  );
  server.registerTool(
    "fetchHarmonyOSDocumentation",
    {
      title: "Fetch HarmonyOS Documentation",
      description: TOOL_DEFINITIONS.fetchHarmonyOSDocumentation.description,
      inputSchema: { path: z.string().min(1) },
      annotations: readOnlyAnnotations,
    },
    async ({ path }) => {
      const normalized = path.replace(/^\/+/, "");
      const content = normalized.startsWith("harmonyos-references/")
        ? renderReferenceMarkdown(
            await fetchReferencePageData(
              normalized.replace("harmonyos-references/", ""),
            ),
            normalized.replace("harmonyos-references/", ""),
          )
        : renderGuideMarkdown(
            await fetchGuidePageData(
              normalized.replace("harmonyos-guides/", ""),
            ),
            normalized.replace("harmonyos-guides/", ""),
          );
      return {
        content: [
          { type: "text", text: assertRenderedMarkdownWithinLimit(content) },
        ],
      };
    },
  );
  server.registerTool(
    "fetchHarmonyOSCatalog",
    {
      title: "Fetch HarmonyOS Catalog",
      description: TOOL_DEFINITIONS.fetchHarmonyOSCatalog.description,
      inputSchema: {
        catalogName: z
          .enum(["harmonyos-guides", "harmonyos-references"])
          .default("harmonyos-guides"),
        language: z.literal("en").default("en"),
        depth: z.number().int().min(1).optional(),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ catalogName, language, depth }) => ({
      content: [
        {
          type: "text",
          text: assertRenderedMarkdownWithinLimit(
            renderCatalogMarkdown(
              await fetchHarmonyOSCatalog(catalogName, language),
              depth,
            ),
          ),
        },
      ],
    }),
  );
  return server;
}
