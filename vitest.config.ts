import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          ratelimits: {
            RATE_LIMITER: { simple: { limit: 10, period: 60 } },
          },
        },
      },
    },
  },
});
