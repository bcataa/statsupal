import type { IncidentSeverity, IncidentStatus } from "@/lib/models/monitoring";
import { hasScope } from "@/lib/developer-api/scopes";
import {
  fetchWorkspaceIncidentsJson,
  insertIncidentForWorkspace,
  serviceBelongsToWorkspace,
} from "@/lib/developer-api/public-api-data";
import {
  authenticateDeveloperApiKey,
  forbiddenScopeResponse,
  rateLimitedDeveloperResponse,
  unauthorizedDeveloperResponse,
} from "@/lib/developer-api/verify-api-key";
import { checkDeveloperApiRateLimit } from "@/lib/rate-limit/developer-api-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEVERITIES = new Set(["minor", "major", "critical"]);
const STATUSES = new Set(["investigating", "identified", "monitoring"]);

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
  if (!hasScope(ctx.scopes, "read:incidents")) {
    return forbiddenScopeResponse("read:incidents");
  }

  try {
    const data = await fetchWorkspaceIncidentsJson(ctx.workspaceId);
    return Response.json({ ok: true, ...data });
  } catch {
    return Response.json({ error: "Could not load incidents." }, { status: 500 });
  }
}

type PostBody = {
  title?: string;
  description?: string;
  affectedServiceId?: string;
  severity?: string;
  status?: string;
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
  if (!hasScope(ctx.scopes, "write:incidents")) {
    return forbiddenScopeResponse("write:incidents");
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = body.title?.trim();
  if (!title || title.length > 500) {
    return Response.json({ error: "title is required (max 500 chars)." }, { status: 400 });
  }

  const affectedServiceId = body.affectedServiceId?.trim();
  if (!affectedServiceId) {
    return Response.json({ error: "affectedServiceId is required." }, { status: 400 });
  }

  const severity = body.severity?.trim().toLowerCase();
  if (!severity || !SEVERITIES.has(severity)) {
    return Response.json({ error: "severity must be minor, major, or critical." }, { status: 400 });
  }

  let status: IncidentStatus | undefined;
  if (body.status != null) {
    const s = body.status.trim().toLowerCase();
    if (!STATUSES.has(s)) {
      return Response.json(
        { error: "status must be investigating, identified, or monitoring." },
        { status: 400 },
      );
    }
    status = s as IncidentStatus;
  }

  const okService = await serviceBelongsToWorkspace(affectedServiceId, ctx.workspaceId);
  if (!okService) {
    return Response.json({ error: "Service not found in this workspace." }, { status: 404 });
  }

  try {
    const { id } = await insertIncidentForWorkspace(ctx.workspaceId, ctx.userId, {
      title,
      description: body.description?.trim(),
      affectedServiceId,
      severity: severity as IncidentSeverity,
      status,
    });
    return Response.json({ ok: true, id }, { status: 201 });
  } catch {
    return Response.json({ error: "Could not create incident." }, { status: 500 });
  }
}
