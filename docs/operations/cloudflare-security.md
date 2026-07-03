# Cloudflare Security

- Worker name: hulistmi-ai
- Public routes: hulistmi.ai/*
- Cloudflare Rate Limiting binding: `RATE_LIMITER`, 60 requests/minute/key
- Public proxy routes call `env.RATE_LIMITER.limit(...)`.
- Logs must not include upstream response bodies or user query bodies.
