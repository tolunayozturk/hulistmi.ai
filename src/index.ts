import { StreamableHTTPTransport } from "@hono/mcp";
import type { Context } from "hono";
import { Hono } from "hono";
import { fetchHarmonyOSCatalog, renderCatalogMarkdown } from "./lib/catalog";
import {
  assertRenderedMarkdownWithinLimit,
  MAX_MCP_REQUEST_BYTES,
  NotFoundError,
  UpstreamPolicyError,
  UpstreamSizeError,
} from "./lib/fetch";
import { fetchGuidePageData, renderGuideMarkdown } from "./lib/guides";
import { createMcpServer, MCP_SERVER_INFO } from "./lib/mcp";
import { enforceRateLimit } from "./lib/rate-limit";
import {
  fetchReferencePageData,
  renderReferenceMarkdown,
} from "./lib/reference";
import { renderSearchMarkdown, searchHarmonyOSDocs } from "./lib/search";
import {
  createSkillIndex,
  loadSkill,
  SKILL_NAME,
  skillHeaders,
  skillIndexHeaders,
} from "./lib/skill";
import { buildWebMcpManifest } from "./lib/webmcp";

export interface Env {
  ASSETS: Fetcher;
  RATE_LIMITER?: {
    limit(options: { key: string }): Promise<{ success: boolean }>;
  };
}

const app = new Hono<{ Bindings: Env }>();
const ROBOTS_HEADER = "noindex, nofollow, noarchive";
const DOC_CACHE = "public, max-age=3600, s-maxage=86400";
const SHORT_CACHE = "public, max-age=300, s-maxage=600";

function origin(c: Context): string {
  return new URL(c.req.url).origin;
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
  catalogName: "harmonyos-guides" | "harmonyos-references",
  path: string,
): Promise<Response> {
  const data =
    catalogName === "harmonyos-guides"
      ? await fetchGuidePageData(path)
      : await fetchReferencePageData(path);
  const content =
    catalogName === "harmonyos-guides"
      ? renderGuideMarkdown(data, path)
      : renderReferenceMarkdown(data, path);
  const bounded = assertRenderedMarkdownWithinLimit(content);
  const sourceUrl = `https://developer.huawei.com/consumer/en/doc/${catalogName}/${path}`;
  setNoIndex(c, DOC_CACHE);
  c.header("Content-Location", sourceUrl);
  c.header("ETag", await sha256(bounded));
  if (wantsJson(c)) return c.json({ url: sourceUrl, content: bounded });
  return c.text(bounded, 200, {
    "Content-Type": "text/markdown; charset=utf-8",
  });
}

async function publicLimit(c: Context, next: () => Promise<void>) {
  const blocked = await enforceRateLimit(c.req.raw, c.env);
  if (blocked) return blocked;
  await next();
}

app.use("/search", publicLimit);
app.use("/catalog", publicLimit);
app.use("/mcp", publicLimit);
app.use("/consumer/en/doc/harmonyos-guides/*", publicLimit);
app.use("/consumer/en/doc/harmonyos-references/*", publicLimit);

app.get("/", async (c) =>
  c.env.ASSETS.fetch(new Request(new URL("/index.html", c.req.url))),
);

app.get("/bot", (c) =>
  c.text(
    "hulistmi.ai uses transparent, on-demand requests for HarmonyOS documentation and identifies itself with hulistmi-ai/1.0 (+https://hulistmi.ai/#bot).",
    200,
    {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": SHORT_CACHE,
    },
  ),
);

app.get("/consumer/en/doc/harmonyos-guides/:path{.+}", async (c) =>
  renderDocument(c, "harmonyos-guides", c.req.param("path")),
);
app.get("/consumer/en/doc/harmonyos-references/:path{.+}", async (c) =>
  renderDocument(c, "harmonyos-references", c.req.param("path")),
);

app.get("/catalog", async (c) => {
  const catalogName = c.req.query("catalogName") ?? "harmonyos-guides";
  const language = c.req.query("language") ?? "en";
  if (
    !["harmonyos-guides", "harmonyos-references"].includes(catalogName) ||
    language !== "en"
  )
    return c.json({ error: "Unsupported catalog" }, 400);
  const catalog = await fetchHarmonyOSCatalog(catalogName, language);
  setNoIndex(c, SHORT_CACHE);
  if (wantsJson(c)) return c.json(catalog);
  return c.text(
    assertRenderedMarkdownWithinLimit(renderCatalogMarkdown(catalog)),
    200,
    { "Content-Type": "text/markdown; charset=utf-8" },
  );
});

app.get("/search", async (c) => {
  const query = c.req.query("q") ?? "";
  if (!query.trim() || query.length > 120)
    return c.json({ error: "Invalid search query" }, 400);
  const result = await searchHarmonyOSDocs(query);
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

app.get(`/.well-known/agent-skills/${SKILL_NAME}/SKILL.md`, async (c) => {
  const skill = await loadSkill(c.env.ASSETS, origin(c));
  return new Response(skill.bytes, { headers: skillHeaders });
});

app.all("/mcp", async (c) => {
  const tooLarge = await assertMcpBodyWithinLimit(c.req.raw);
  if (tooLarge) return tooLarge;
  const mcpServer = createMcpServer();
  const transport = new StreamableHTTPTransport();
  await mcpServer.connect(transport);
  return transport.handleRequest(c);
});

app.onError((err, c) => {
  c.header("Cache-Control", "no-store");
  c.header("X-Robots-Tag", ROBOTS_HEADER);
  if (err instanceof NotFoundError) return c.json({ error: "Not found" }, 404);
  if (err instanceof UpstreamPolicyError)
    return c.json(
      { error: "Upstream policy prevents rendering this content" },
      502,
    );
  if (err instanceof UpstreamSizeError)
    return c.json({ error: "Upstream content is too large" }, 502);
  if (
    err instanceof Error &&
    /invalid|unsupported|required|too long/i.test(err.message)
  )
    return c.json({ error: err.message }, 400);
  return c.json({ error: "Unable to render HarmonyOS documentation" }, 502);
});

export default app;
