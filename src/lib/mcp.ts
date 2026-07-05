import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchHarmonyOSCatalog, renderCatalogMarkdown } from "./catalog";
import { SUPPORTED_CATALOGS } from "./catalog-name";
import { assertRenderedMarkdownWithinLimit } from "./fetch";
import { fetchAndRenderCatalogPage } from "./generic";
import { DEFAULT_LANGUAGE } from "./language";
import { renderSearchMarkdown, searchHarmonyOSDocs } from "./search";
import { UPSTREAM_CONTRACT } from "./upstream-contract";
import { splitDocsPath } from "./url";
import { VERSION } from "./version";

export const MCP_SERVER_INFO = {
  name: "hulistmi.ai",
  version: VERSION,
} as const;

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

const languageSchema = z.enum(["en", "cn"]).default(DEFAULT_LANGUAGE);

export const SEARCH_INPUT_SCHEMA = {
  query: z.string().min(1).max(UPSTREAM_CONTRACT.search.maxQueryLength),
  language: languageSchema,
};

export const FETCH_DOC_INPUT_SCHEMA = {
  path: z.string().min(1),
  language: languageSchema,
};

export const FETCH_CATALOG_INPUT_SCHEMA = {
  catalogName: z
    .enum([...SUPPORTED_CATALOGS] as [string, ...string[]])
    .default("harmonyos-guides"),
  language: languageSchema,
  depth: z.number().int().min(1).optional(),
};

export const TOOL_DEFINITIONS = {
  searchHarmonyOSDocumentation: {
    description:
      "Search HarmonyOS developer documentation. Pass language=cn for Chinese-language results.",
    http: { path: "/search", query: { q: "query", language: "language" } },
  },
  fetchHarmonyOSDocumentation: {
    description:
      "Fetch a HarmonyOS documentation page as Markdown. Pass language=cn to fetch the Chinese version.",
    http: { path: "/{path}", query: {} },
  },
  fetchHarmonyOSCatalog: {
    description:
      "Fetch a HarmonyOS documentation catalog. Pass language=cn for the Chinese catalog.",
    http: {
      path: "/catalog",
      query: {
        catalogName: "catalogName",
        language: "language",
        depth: "depth",
      },
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
      inputSchema: SEARCH_INPUT_SCHEMA,
      annotations: readOnlyAnnotations,
    },
    async ({ query, language }) => ({
      content: [
        {
          type: "text",
          text: assertRenderedMarkdownWithinLimit(
            renderSearchMarkdown(await searchHarmonyOSDocs(query, language)),
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
      inputSchema: FETCH_DOC_INPUT_SCHEMA,
      annotations: readOnlyAnnotations,
    },
    async ({ path, language }) => {
      const normalized = path.replace(/^\/+/, "");
      const { catalogName, pagePath } = splitDocsPath(normalized);
      const { content } = await fetchAndRenderCatalogPage(
        catalogName,
        pagePath,
        language,
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
      inputSchema: FETCH_CATALOG_INPUT_SCHEMA,
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
