import { SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchHuaweiJsonMock = vi.fn(async (request: { url: string }) => {
  if (request.url.includes("/checkCenterGrayUser")) {
    return { code: 0, message: "success", value: { isGrayUser: 0 } };
  }
  return {
    code: 0,
    message: "success",
    value: {
      status: "4",
      title: "Preparations for Development",
      content: { content: "<p>Build a HarmonyOS app.</p>" },
    },
  };
});

vi.mock("../src/lib/fetch", () => ({
  fetchHuaweiJson: (...args: unknown[]) => fetchHuaweiJsonMock(...args),
  assertRenderedMarkdownWithinLimit: (content: string) => content,
  NotFoundError: class NotFoundError extends Error {},
  UpstreamPolicyError: class UpstreamPolicyError extends Error {},
  UpstreamSizeError: class UpstreamSizeError extends Error {},
  UpstreamTimeoutError: class UpstreamTimeoutError extends Error {},
  MAX_MCP_REQUEST_BYTES: 131_072,
  MAX_RENDERED_MARKDOWN_BYTES: 524_288,
  MAX_UPSTREAM_RESPONSE_BYTES: 1_048_576,
  UPSTREAM_TIMEOUT_MS: 10_000,
  HULISTMI_USER_AGENT: "hulistmi-ai/1.0",
}));

describe("Hono app routing", () => {
  beforeEach(() => {
    fetchHuaweiJsonMock.mockClear();
  });

  it("serves /consumer/en/doc/harmonyos-guides/start-overview with en Content-Location (backwards compat)", async () => {
    const res = await SELF.fetch(
      new Request(
        "https://hulistmi.ai/consumer/en/doc/harmonyos-guides/start-overview",
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Location")).toBe(
      "https://developer.huawei.com/consumer/en/doc/harmonyos-guides/start-overview",
    );
  });

  it("serves /consumer/cn/doc/harmonyos-guides/start-overview with cn Content-Location and stamps cn upstream", async () => {
    const res = await SELF.fetch(
      new Request(
        "https://hulistmi.ai/consumer/cn/doc/harmonyos-guides/start-overview",
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Location")).toBe(
      "https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/start-overview",
    );
    expect(fetchHuaweiJsonMock.mock.calls[0][0].body).toMatchObject({
      language: "cn",
    });
  });

  it("rejects /consumer/xx/doc/... with 400 (unsupported language)", async () => {
    const res = await SELF.fetch(
      new Request(
        "https://hulistmi.ai/consumer/xx/doc/harmonyos-guides/start-overview",
      ),
    );
    expect(res.status).toBe(400);
  });

  it("rejects /consumer/cn/doc/<unknown-catalog>/foo with 400 (unsupported catalog)", async () => {
    const res = await SELF.fetch(
      new Request("https://hulistmi.ai/consumer/cn/doc/bogus-catalog/foo"),
    );
    expect(res.status).toBe(400);
  });
});
