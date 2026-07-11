export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface RateLimitEnv {
  RATE_LIMITER?: RateLimitBinding;
}

export async function enforceRateLimit(
  request: Request,
  env: RateLimitEnv,
): Promise<Response | null> {
  if (!env.RATE_LIMITER) return null;
  const url = new URL(request.url);
  const ip = request.headers.get("CF-Connecting-IP") ?? "anonymous";
  const route = url.pathname.split("/")[1] || "root";
  const result = await env.RATE_LIMITER.limit({ key: `${ip}:${route}` });
  if (result.success) return null;
  return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": "60",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
