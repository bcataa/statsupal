/**
 * In-memory rate limit for developer API (Bearer keys). Keyed by API key id + client IP.
 * Not suitable for multi-instance without shared store.
 */

import { getClientIp, checkRateLimit, type RateLimitResult } from "@/lib/rate-limit/ip-rate-limit";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 120;

export function checkDeveloperApiRateLimit(request: Request, apiKeyId: string): RateLimitResult {
  const ip = getClientIp(request);
  return checkRateLimit(`devapi:${apiKeyId}:${ip}`, MAX_PER_WINDOW, WINDOW_MS);
}
