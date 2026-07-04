import { PUBLIC_ORIGIN } from "./origin";
import { UPSTREAM_CONTRACT } from "./upstream-contract";
import { VERSION } from "./version";

export class NotFoundError extends Error {}
export class UpstreamPolicyError extends Error {}
export class UpstreamSizeError extends Error {}
export class UpstreamTimeoutError extends Error {}

export const HULISTMI_USER_AGENT = `hulistmi-ai/${VERSION} (+${PUBLIC_ORIGIN}/bot)`;
export const UPSTREAM_TIMEOUT_MS = 10_000;
export const MAX_UPSTREAM_RESPONSE_BYTES = 1_048_576;
export const MAX_RENDERED_MARKDOWN_BYTES = 524_288;
export const MAX_MCP_REQUEST_BYTES = 131_072;

export interface VerifiedHuaweiRequest {
  url: string;
  headers?: Record<string, string>;
  body: unknown;
}

function assertAllowedHuaweiUrl(input: string): URL {
  const url = new URL(input);
  if (
    url.protocol !== "https:" ||
    !UPSTREAM_CONTRACT.allowedHosts.includes(url.hostname) ||
    !UPSTREAM_CONTRACT.allowedPaths.includes(url.pathname)
  ) {
    throw new Error(`Unverified Huawei upstream URL: ${input}`);
  }
  return url;
}

function collectVerifiedRequests(): VerifiedHuaweiRequest[] {
  return [
    ...Object.values(UPSTREAM_CONTRACT.catalogs).map((entry) => entry.request),
    ...Object.values(UPSTREAM_CONTRACT.documents).flatMap((doc) =>
      [
        doc.checkCenterGrayUser,
        doc.getDocumentById,
        "getCenterRootNodeTree" in doc ? doc.getCenterRootNodeTree : undefined,
        "getCenterDocument" in doc ? doc.getCenterDocument : undefined,
      ].filter((request): request is VerifiedHuaweiRequest => Boolean(request)),
    ),
    {
      url: UPSTREAM_CONTRACT.search.url,
      headers: UPSTREAM_CONTRACT.search.headers,
      body: UPSTREAM_CONTRACT.search.searchBodyTemplate,
    },
  ];
}

function isVerifiedHeaderValue(name: string, value: string): boolean {
  return collectVerifiedRequests().some((request) =>
    Object.entries(request.headers ?? {}).some(
      ([key, verified]) => key.toLowerCase() === name && verified === value,
    ),
  );
}

function verifiedHeaders(request: VerifiedHuaweiRequest): HeadersInit {
  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": HULISTMI_USER_AGENT,
  });
  for (const [key, value] of Object.entries(request.headers ?? {})) {
    const lower = key.toLowerCase();
    if (
      (lower === "origin" || lower === "referer") &&
      isVerifiedHeaderValue(lower, value)
    )
      headers.set(key, value);
  }
  return headers;
}

async function readCappedText(
  response: Response,
  maxBytes: number,
): Promise<string> {
  const contentLength = Number(response.headers.get("Content-Length") ?? "0");
  if (contentLength > maxBytes)
    throw new UpstreamSizeError(
      "Huawei upstream response exceeded maximum size",
    );
  if (!response.body) return response.text();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new UpstreamSizeError(
        "Huawei upstream response exceeded maximum size",
      );
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function fetchHuaweiJson<T>(
  request: VerifiedHuaweiRequest,
  maxBytes = MAX_UPSTREAM_RESPONSE_BYTES,
): Promise<T> {
  const verifiedUrl = assertAllowedHuaweiUrl(request.url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(verifiedUrl, {
      method: "POST",
      headers: verifiedHeaders(request),
      body: JSON.stringify(request.body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw new UpstreamTimeoutError("Huawei upstream request timed out");
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const robots = response.headers.get("X-Robots-Tag")?.toLowerCase() ?? "";
  if (
    robots.includes("noai") ||
    robots.includes("none") ||
    robots.includes("noindex")
  ) {
    throw new UpstreamPolicyError(
      "Upstream policy disallows rendering this content",
    );
  }

  if (!response.ok)
    throw new Error(`Huawei upstream request failed: ${response.status}`);
  const data = JSON.parse(await readCappedText(response, maxBytes)) as T & {
    code?: number | string;
  };
  if (data.code === 404 || data.code === "404")
    throw new NotFoundError("Huawei document not found");
  return data;
}

export function assertRenderedMarkdownWithinLimit(content: string): string {
  if (
    new TextEncoder().encode(content).byteLength > MAX_RENDERED_MARKDOWN_BYTES
  ) {
    throw new UpstreamSizeError("Rendered markdown exceeded maximum size");
  }
  return content;
}
