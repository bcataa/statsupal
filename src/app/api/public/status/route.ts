import { hasScope } from "@/lib/developer-api/scopes";
import { fetchWorkspaceStatusJson } from "@/lib/developer-api/public-api-data";
import {
  authenticateDeveloperApiKey,
  forbiddenScopeResponse,
  rateLimitedDeveloperResponse,
  unauthorizedDeveloperResponse,
} from "@/lib/developer-api/verify-api-key";
import { checkDeveloperApiRateLimit } from "@/lib/rate-limit/developer-api-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authenticateDeveloperApiKey(request);
  if (!auth.ok) {
    return unauthorizedDeveloperResponse(auth.failure);
  }
  const ctx = auth.ctx;
  const rl = checkDeveloperApiRateLimit(request, ctx.keyId);
  if (!rl.ok) {
    return rateLimitedDeveloperResponse(rl.retryAfterSec);
  }
  if (!hasScope(ctx.scopes, "read:status")) {
    return forbiddenScopeResponse("read:status");
  }

  try {
    const data = await fetchWorkspaceStatusJson(ctx.workspaceId);
    return Response.json({ ok: true, ...data });
  } catch {
    return Response.json({ error: "Could not load status." }, { status: 500 });
  }
}
