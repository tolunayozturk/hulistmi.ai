export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface RateLimitEnv {
  RATE_LIMITER?: RateLimitBinding;
}

/**
 * `route` names the bucket. It is fixed by the caller, not read from the request
 * URL: the URL keeps the client's percent-encoding while the router decodes it, so
 * /%73earch would reach /search under a fresh bucket.
 */
export async function enforceRateLimit(
  request: Request,
  env: RateLimitEnv,
  route: string,
): Promise<Response | null> {
  if (!env.RATE_LIMITER) return null;
  const ip = request.headers.get("CF-Connecting-IP") ?? "anonymous";
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
