import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { enforceRateLimit } from "../src/lib/rate-limit";

describe("public route rate limits", () => {
  it("uses the Cloudflare binding result", async () => {
    const blocked = await enforceRateLimit(
      new Request("https://hulistmi.ai/search?q=UIAbility"),
      {
        RATE_LIMITER: { limit: async () => ({ success: false }) },
      },
      "search",
    );
    expect(blocked?.status).toBe(429);

    await expect(
      enforceRateLimit(
        new Request("https://hulistmi.ai/catalog"),
        { RATE_LIMITER: { limit: async () => ({ success: true }) } },
        "catalog",
      ),
    ).resolves.toBeNull();
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

    // The router decodes the path but the request URL keeps the encoding, so a
    // percent-encoded spelling of the route must not get a fresh bucket.
    for (const spelling of ["/%73earch", "/s%65arch", "/%73%65%61%72%63%68"]) {
      const encoded = await SELF.fetch(
        new Request(`https://hulistmi.ai${spelling}?q=`),
      );
      expect(encoded.status, spelling).toBe(429);
    }
  });
});
