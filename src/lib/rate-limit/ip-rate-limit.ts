/**
 * Simple in-memory rate limiter per IP. Resets entries lazily. Not suitable for multi-instance scale-out.
 */

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX = 60;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) {
    return realIp.trim();
  }
  return "unknown";
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export function checkRateLimit(
  key: string,
  maxRequests: number = DEFAULT_MAX,
  windowMs: number = DEFAULT_WINDOW_MS,
): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    bucket = { count: 1, windowStart: now };
    buckets.set(key, bucket);
    return { ok: true };
  }
  bucket.count += 1;
  if (bucket.count > maxRequests) {
    const retryAfterSec = Math.ceil((bucket.windowStart + windowMs - now) / 1000);
    return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }
  return { ok: true };
}

/** For tests only */
export function resetRateLimitStore() {
  buckets.clear();
}
