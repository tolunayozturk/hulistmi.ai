import { SELF } from "cloudflare:test";
import { describe, expect, it, vi } from "vitest";
import { enforceRateLimit } from "../src/lib/rate-limit";

describe("public route rate limits", () => {
  it("uses the Cloudflare binding result", async () => {
    const blocked = await enforceRateLimit(
      new Request("https://hulistmi.ai/search?q=UIAbility"),
      {
        RATE_LIMITER: { limit: async () => ({ success: false }) },
      },
    );
    expect(blocked?.status).toBe(429);

    await expect(
      enforceRateLimit(new Request("https://hulistmi.ai/catalog"), {
        RATE_LIMITER: { limit: async () => ({ success: true }) },
      }),
    ).resolves.toBeNull();
  });

  it("rate-limits /consumer/cn/doc/... under the shared 'consumer' bucket", async () => {
    const limiter = { limit: vi.fn(async () => ({ success: true })) };
    await enforceRateLimit(
      new Request(
        "https://hulistmi.ai/consumer/cn/doc/harmonyos-guides/start-overview",
      ),
      { RATE_LIMITER: limiter },
    );
    expect(limiter.limit).toHaveBeenCalledWith({ key: "anonymous:consumer" });
  });
});

describe("rate limiting through the full Hono app", () => {
  it("returns 429 after exceeding the limit and does not throttle unguarded routes", async () => {
    for (let i = 0; i < 10; i++) {
      const res = await SELF.fetch(
        new Request("https://hulistmi.ai/search?q="),
      );
      expect(res.status).toBe(400);
    }

    const blocked = await SELF.fetch(
      new Request("https://hulistmi.ai/search?q="),
    );
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBe("60");
    expect(blocked.headers.get("Cache-Control")).toBe("no-store");
    expect(blocked.headers.get("X-Robots-Tag")).toBe(
      "noindex, nofollow, noarchive",
    );
    expect(await blocked.json()).toEqual({ error: "Rate limit exceeded" });

    const bot = await SELF.fetch(new Request("https://hulistmi.ai/bot"));
    expect(bot.status).toBe(200);
  });
});
