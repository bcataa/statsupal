import { hasScope } from "@/lib/developer-api/scopes";
import { fetchWorkspaceUptimeJson } from "@/lib/developer-api/public-api-data";
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
  if (!hasScope(ctx.scopes, "read:uptime")) {
    return forbiddenScopeResponse("read:uptime");
  }

  try {
    const { windows, bars24h, publishedServiceIds } = await fetchWorkspaceUptimeJson(
      ctx.workspaceId,
    );
    return Response.json({
      ok: true,
      uptime: windows,
      bars24h,
      publishedServiceCount: publishedServiceIds.length,
    });
  } catch {
    return Response.json({ error: "Could not load uptime." }, { status: 500 });
  }
}
