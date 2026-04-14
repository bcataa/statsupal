import { hasScope } from "@/lib/developer-api/scopes";
import { insertMaintenanceForWorkspace, serviceBelongsToWorkspace } from "@/lib/developer-api/public-api-data";
import {
  authenticateDeveloperApiKey,
  forbiddenScopeResponse,
  rateLimitedDeveloperResponse,
  unauthorizedDeveloperResponse,
} from "@/lib/developer-api/verify-api-key";
import { checkDeveloperApiRateLimit } from "@/lib/rate-limit/developer-api-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PostBody = {
  title?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  affectedServiceIds?: string[];
};

export async function POST(request: Request) {
  const auth = await authenticateDeveloperApiKey(request);
  if (!auth.ok) {
    return unauthorizedDeveloperResponse(auth.failure);
  }
  const ctx = auth.ctx;
  const rl = checkDeveloperApiRateLimit(request, ctx.keyId);
  if (!rl.ok) {
    return rateLimitedDeveloperResponse(rl.retryAfterSec);
  }
  if (!hasScope(ctx.scopes, "write:maintenance")) {
    return forbiddenScopeResponse("write:maintenance");
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = body.title?.trim();
  if (!title || title.length > 200) {
    return Response.json({ error: "title is required (max 200 chars)." }, { status: 400 });
  }

  const startsAt = body.startsAt?.trim();
  const endsAt = body.endsAt?.trim();
  if (!startsAt || !endsAt) {
    return Response.json({ error: "startsAt and endsAt (ISO 8601) are required." }, { status: 400 });
  }

  const ids = Array.isArray(body.affectedServiceIds) ? body.affectedServiceIds : [];
  const affectedServiceIds = ids.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
  if (affectedServiceIds.length === 0) {
    return Response.json({ error: "affectedServiceIds must be a non-empty array." }, { status: 400 });
  }

  for (const sid of affectedServiceIds) {
    const ok = await serviceBelongsToWorkspace(sid, ctx.workspaceId);
    if (!ok) {
      return Response.json({ error: `Service not in workspace: ${sid}` }, { status: 400 });
    }
  }

  try {
    const { id } = await insertMaintenanceForWorkspace(ctx.workspaceId, ctx.userId, {
      title,
      description: body.description?.trim(),
      startsAt,
      endsAt,
      affectedServiceIds,
    });
    return Response.json({ ok: true, id }, { status: 201 });
  } catch {
    return Response.json({ error: "Could not create maintenance window." }, { status: 500 });
  }
}
