import { hasScope, type ApiScope } from "@/lib/developer-api/scopes";
import {
  authenticateDeveloperApiKey,
  forbiddenScopeResponse,
  rateLimitedDeveloperResponse,
  unauthorizedDeveloperResponse,
  type VerifiedApiKeyContext,
} from "@/lib/developer-api/verify-api-key";
import { checkDeveloperApiRateLimit } from "@/lib/rate-limit/developer-api-rate-limit";

export type ScopedApiKeyResult =
  | { ok: true; ctx: VerifiedApiKeyContext }
  | { ok: false; response: Response };

/**
 * Verify Bearer API key, rate limit, and a single required scope. Use in Route Handlers.
 */
export async function requireDeveloperApiKey(
  request: Request,
  requiredScope: ApiScope,
): Promise<ScopedApiKeyResult> {
  const auth = await authenticateDeveloperApiKey(request);
  if (!auth.ok) {
    return { ok: false, response: unauthorizedDeveloperResponse(auth.failure) };
  }
  const ctx = auth.ctx;
  const rl = checkDeveloperApiRateLimit(request, ctx.keyId);
  if (!rl.ok) {
    return { ok: false, response: rateLimitedDeveloperResponse(rl.retryAfterSec) };
  }
  if (!hasScope(ctx.scopes, requiredScope)) {
    return { ok: false, response: forbiddenScopeResponse(requiredScope) };
  }
  return { ok: true, ctx };
}
