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
