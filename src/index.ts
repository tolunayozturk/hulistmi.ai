import { StreamableHTTPTransport } from "@hono/mcp";
import type { Context } from "hono";
import { Hono } from "hono";
import { fetchHarmonyOSCatalog, renderCatalogMarkdown } from "./lib/catalog";
import { type CatalogName, isCatalogName } from "./lib/catalog-name";
import {
  assertRenderedMarkdownWithinLimit,
  MAX_MCP_REQUEST_BYTES,
  NotFoundError,
  UpstreamPolicyError,
  UpstreamSizeError,
} from "./lib/fetch";
import { fetchAndRenderCatalogPage } from "./lib/generic";
import { DEFAULT_LANGUAGE, isLanguage, type Language } from "./lib/language";
import { createMcpServer, MCP_SERVER_INFO } from "./lib/mcp";
import {
  hulistmiUserAgent,
  InvalidOriginError,
  parsePublicOrigin,
  selfHostedNote,
} from "./lib/origin";
import { enforceRateLimit } from "./lib/rate-limit";
import { renderSearchMarkdown, searchHarmonyOSDocs } from "./lib/search";
import {
  createSkillIndex,
  loadSkill,
  SKILL_NAME,
  skillHeaders,
  skillIndexHeaders,
} from "./lib/skill";
import { fillPlaceholders } from "./lib/static-pages";
import { UPSTREAM_CONTRACT } from "./lib/upstream-contract";
import { buildWebMcpManifest } from "./lib/webmcp";

export interface Env {
  ASSETS: Fetcher;
  /** Origin this deployment presents as, for a proxy or custom domain. Defaults to the request's origin. */
  PUBLIC_ORIGIN?: string;
  RATE_LIMITER?: {
    limit(options: { key: string }): Promise<{ success: boolean }>;
  };
}

const app = new Hono<{ Bindings: Env }>();
const ROBOTS_HEADER = "noindex, nofollow, noarchive";
const DOC_CACHE = "public, max-age=3600, s-maxage=86400";
const SHORT_CACHE = "public, max-age=300, s-maxage=600";

// Computed per request and passed down, never stored: a Worker can answer on more
// than one hostname, and concurrent requests must not see each other's origin.
function origin(c: Context): string {
  return (
    parsePublicOrigin("PUBLIC_ORIGIN", c.env?.PUBLIC_ORIGIN) ??
    new URL(c.req.url).origin
  );
}

function wantsJson(c: Context): boolean {
  return c.req.header("Accept")?.includes("application/json") ?? false;
}

function setNoIndex(c: Context, cacheControl: string): void {
  c.header("X-Robots-Tag", ROBOTS_HEADER);
  c.header("Cache-Control", cacheControl);
  c.header("Vary", "Accept");
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return `"${Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}"`;
}

// Huawei signs each image URL anew on every request (HW-CC-Date, HW-CC-Sign), so the
// same page differs byte for byte between fetches. The document ETag keeps only the
// day of the signature: the links expire a day after signing, so a copy from an
// earlier day must look out of date. The tag is weak: equal tags mean the same
// content, not the same bytes.
function withoutImageSignatures(markdown: string): string {
  return markdown
    .replace(/(HW-CC-Date=\d{8})[^&)\s]*/g, "$1")
    .replace(/(HW-CC-Sign=)[^&)\s]*/g, "$1");
}

async function assertMcpBodyWithinLimit(
  request: Request,
): Promise<Response | null> {
  if (request.method === "GET" || request.method === "HEAD") return null;
  const declared = Number(request.headers.get("Content-Length") ?? "NaN");
  if (!Number.isFinite(declared) || declared > MAX_MCP_REQUEST_BYTES)
    return bodyTooLarge();
  const reader = request.clone().body?.getReader();
  if (!reader) return null;
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_MCP_REQUEST_BYTES) {
      await reader.cancel();
      return bodyTooLarge();
    }
  }
  return null;
}

function bodyTooLarge(): Response {
  return new Response(JSON.stringify({ error: "Request body too large" }), {
    status: 413,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

async function renderDocument(
  c: Context,
  catalogName: CatalogName,
  path: string,
  language: Language,
): Promise<Response> {
  const { sourceUrl, content } = await fetchAndRenderCatalogPage(
    catalogName,
    path,
    language,
    origin(c),
  );
  const bounded = assertRenderedMarkdownWithinLimit(content);
  setNoIndex(c, DOC_CACHE);
  c.header("Content-Location", sourceUrl);
  c.header("X-Retrieved-At", new Date().toISOString());
  c.header("ETag", `W/${await sha256(withoutImageSignatures(bounded))}`);
  if (wantsJson(c)) return c.json({ url: sourceUrl, content: bounded });
  return c.text(bounded, 200, {
    "Content-Type": "text/markdown; charset=utf-8",
  });
}

function publicLimit(route: string) {
  return async (c: Context, next: () => Promise<void>) => {
    const blocked = await enforceRateLimit(c.req.raw, c.env, route);
    if (blocked) return blocked;
    await next();
  };
}

app.use("/search", publicLimit("search"));
app.use("/catalog", publicLimit("catalog"));
app.use("/mcp", publicLimit("mcp"));
app.use("/consumer/:lang/doc/*", publicLimit("consumer"));

// Served through the Worker, not straight from the assets, so each deployment names
// itself in them. The asset's ETag and length describe the unfilled file, so they are
// replaced.
async function serveStaticPage(c: Context, path: string): Promise<Response> {
  const asset = await c.env.ASSETS.fetch(new Request(new URL(path, c.req.url)));
  if (!asset.ok) return asset;
  const format = path.endsWith(".html") ? "html" : "text";
  const text = fillPlaceholders(await asset.text(), origin(c), format);
  const headers = new Headers(asset.headers);
  headers.delete("Content-Length");
  headers.set("ETag", await sha256(text));
  return new Response(text, { status: asset.status, headers });
}

app.get("/", (c) => serveStaticPage(c, "/index.html"));
app.get("/llms.txt", (c) => serveStaticPage(c, "/llms.txt"));
app.get("/sitemap.xml", (c) => serveStaticPage(c, "/sitemap.xml"));

app.get("/bot", (c) => {
  const self = origin(c);
  const note = selfHostedNote(self);
  return c.text(
    `hulistmi.ai uses transparent, on-demand requests for HarmonyOS documentation and identifies itself with ${hulistmiUserAgent(self)}.${note ? ` ${note}` : ""}`,
    200,
    {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": SHORT_CACHE,
    },
  );
});

app.get("/consumer/:lang/doc/:catalog/:path{.+}", async (c) => {
  const lang = c.req.param("lang");
  if (!isLanguage(lang)) return c.json({ error: "Unsupported language" }, 400);
  const catalogName = c.req.param("catalog");
  if (!isCatalogName(catalogName))
    return c.json({ error: "Unsupported catalog" }, 400);
  return renderDocument(c, catalogName, c.req.param("path"), lang);
});

app.get("/catalog", async (c) => {
  const catalogName = c.req.query("catalogName") ?? "harmonyos-guides";
  const languageParam = c.req.query("language") ?? DEFAULT_LANGUAGE;
  if (!isCatalogName(catalogName) || !isLanguage(languageParam))
    return c.json({ error: "Unsupported catalog" }, 400);
  const depthRaw = c.req.query("depth");
  const depth = depthRaw ? Number(depthRaw) : undefined;
  if (depth !== undefined && (!Number.isFinite(depth) || depth < 1))
    return c.json({ error: "Unsupported catalog" }, 400);
  const catalog = await fetchHarmonyOSCatalog(
    catalogName,
    languageParam,
    origin(c),
  );
  setNoIndex(c, SHORT_CACHE);
  if (wantsJson(c)) return c.json(catalog);
  return c.text(
    assertRenderedMarkdownWithinLimit(renderCatalogMarkdown(catalog, depth)),
    200,
    { "Content-Type": "text/markdown; charset=utf-8" },
  );
});

app.get("/search", async (c) => {
  const query = c.req.query("q") ?? "";
  if (!query.trim() || query.length > UPSTREAM_CONTRACT.search.maxQueryLength)
    return c.json({ error: "Invalid search query" }, 400);
  const languageParam = c.req.query("language") ?? DEFAULT_LANGUAGE;
  if (!isLanguage(languageParam))
    return c.json({ error: "Unsupported language" }, 400);
  const result = await searchHarmonyOSDocs(query, languageParam, origin(c));
  setNoIndex(c, SHORT_CACHE);
  if (wantsJson(c)) return c.json(result);
  return c.text(
    assertRenderedMarkdownWithinLimit(renderSearchMarkdown(result)),
    200,
    { "Content-Type": "text/markdown; charset=utf-8" },
  );
});

app.get("/.well-known/mcp/server-card.json", (c) =>
  c.json({
    serverInfo: MCP_SERVER_INFO,
    endpoint: `${origin(c)}/mcp`,
    transports: ["streamable-http"],
  }),
);

app.get("/webmcp/manifest.json", (c) => c.json(buildWebMcpManifest(origin(c))));

app.get("/.well-known/api-catalog", (c) =>
  c.json(
    {
      linkset: [
        {
          anchor: `${origin(c)}/mcp`,
          item: [
            {
              href: `${origin(c)}/.well-known/mcp/server-card.json`,
              rel: "service-desc",
            },
            { href: `${origin(c)}/webmcp/manifest.json`, rel: "manifest" },
          ],
        },
      ],
    },
    200,
    {
      "Content-Type": "application/linkset+json; charset=utf-8",
      "Cache-Control": SHORT_CACHE,
    },
  ),
);

app.get("/.well-known/agent-skills/index.json", async (c) => {
  const skill = await loadSkill(c.env.ASSETS, origin(c));
  return c.json(await createSkillIndex(skill), 200, skillIndexHeaders);
});

async function serveSkill(c: Context): Promise<Response> {
  const skill = await loadSkill(c.env.ASSETS, origin(c));
  return new Response(skill.bytes, { headers: skillHeaders });
}

app.get("/SKILL.md", serveSkill);
app.get(`/.well-known/agent-skills/${SKILL_NAME}/SKILL.md`, serveSkill);

app.all("/mcp", async (c) => {
  const tooLarge = await assertMcpBodyWithinLimit(c.req.raw);
  if (tooLarge) return tooLarge;
  const mcpServer = createMcpServer(origin(c));
  const transport = new StreamableHTTPTransport();
  await mcpServer.connect(transport);
  return transport.handleRequest(c);
});

app.onError((err, c) => {
  c.header("Cache-Control", "no-store");
  c.header("X-Robots-Tag", ROBOTS_HEADER);
  if (err instanceof NotFoundError) return c.json({ error: "Not found" }, 404);
  if (err instanceof InvalidOriginError) {
    // The operator's mistake: the detail goes to the logs, not to the public.
    console.error(err.message);
    return c.json({ error: "Server misconfigured" }, 500);
  }
  if (err instanceof UpstreamPolicyError)
    return c.json(
      { error: "Upstream policy prevents rendering this content" },
      502,
    );
  if (err instanceof UpstreamSizeError)
    return c.json({ error: "Upstream content is too large" }, 502);
  return c.json({ error: "Unable to render HarmonyOS documentation" }, 502);
});

export default app;
