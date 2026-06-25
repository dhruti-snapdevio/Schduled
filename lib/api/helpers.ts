import { NextResponse } from "next/server";

// ── Redirect-target sanitization ──────────────────────────────────────────────

/**
 * Returns `value` only if it is a safe, same-origin relative path. Rejects
 * absolute URLs, protocol-relative URLs (`//evil.com`), backslash tricks, and
 * anything that doesn't start with a single "/", falling back to `fallback`.
 * Use before building a redirect from any user-supplied `returnTo`.
 */
export function safeReturnTo(
  value: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!value) return fallback;
  // Must be a relative path: starts with exactly one slash, no scheme, no
  // protocol-relative "//" or "/\" host-injection.
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("://")) return fallback;
  return value;
}

// ── Typed response helpers ───────────────────────────────────────────────────

export function jsonOk<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status }) as NextResponse<T>;
}

export function jsonError(
  message: string,
  status: number
): NextResponse<{ error: string }> {
  return NextResponse.json({ error: message }, { status });
}

// ── In-memory rate limiter ───────────────────────────────────────────────────
// Single-instance only. Sufficient for MVP; swap to Redis/Upstash for multi-node.

type Bucket = { count: number; resetAt: number };
const _store = new Map<string, Bucket>();

// Prune expired buckets every 5 minutes to prevent unbounded memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _store) {
    if (v.resetAt < now) _store.delete(k);
  }
}, 5 * 60 * 1000).unref?.();

/**
 * Returns true if the request should be allowed, false if rate-limited.
 *
 * @param key      Unique bucket key — include route + IP so limits are per-endpoint
 * @param limit    Max hits allowed within the window
 * @param windowMs Window length in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const bucket = _store.get(key);
  if (!bucket || bucket.resetAt < now) {
    _store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/**
 * Extract the best available client IP from request headers.
 * Supports Vercel, Cloudflare, nginx reverse proxies.
 */
export function getClientIp(request: Request): string {
  // Prefer headers set exclusively by trusted infrastructure (cannot be spoofed by clients).
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // X-Forwarded-For: leftmost value is client-controlled and spoofable.
  // The rightmost value is appended by the server's direct upstream proxy and is trustworthy.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    return parts[parts.length - 1].trim();
  }

  return "unknown";
}

/**
 * Build a scoped rate-limit key: `"<route>:<ip>"`.
 */
export function rateLimitKey(route: string, request: Request): string {
  return `${route}:${getClientIp(request)}`;
}
