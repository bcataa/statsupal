import { checkRateLimit, getClientIp } from "@/lib/rate-limit/ip-rate-limit";

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  "status:subscribe": { max: 40, windowMs: 15 * 60 * 1000 },
  "status:unsubscribe": { max: 60, windowMs: 15 * 60 * 1000 },
  "monitor:get": { max: 120, windowMs: 15 * 60 * 1000 },
  "domain:verify": { max: 40, windowMs: 15 * 60 * 1000 },
  "health:get": { max: 120, windowMs: 15 * 60 * 1000 },
  "health:monitoring": { max: 60, windowMs: 15 * 60 * 1000 },
};

export function publicRateLimitExceeded(
  request: Request,
  routeKey: keyof typeof LIMITS,
): Response | null {
  const ip = getClientIp(request);
  const cfg = LIMITS[routeKey];
  const key = `${routeKey}:${ip}`;
  const result = checkRateLimit(key, cfg.max, cfg.windowMs);
  if (result.ok) {
    return null;
  }
  return Response.json(
    { success: false, message: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSec),
      },
    },
  );
}
