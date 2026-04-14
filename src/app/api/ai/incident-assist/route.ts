import { NextResponse } from "next/server";
import { runIncidentAssist, type IncidentAssistAction } from "@/lib/ai/incident-assistant";
import type { Incident } from "@/lib/models/monitoring";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureWorkspace } from "@/lib/supabase/app-data";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS = new Set<IncidentAssistAction>([
  "summarize",
  "draft_public_update",
  "likely_cause",
  "rewrite_customer",
]);

type Body = {
  incidentId?: string;
  action?: string;
  notes?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const incidentId = body.incidentId?.trim();
  const action = body.action?.trim() as IncidentAssistAction | undefined;
  if (!incidentId || !action || !ACTIONS.has(action)) {
    return NextResponse.json(
      {
        error:
          "incidentId and a valid action are required: summarize, draft_public_update, likely_cause, rewrite_customer.",
      },
      { status: 400 },
    );
  }

  try {
    const workspace = await ensureWorkspace(supabase, user.id);
    const admin = createAdminClient();

    const incRes = await (
      admin as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (c: string, v: string) => {
              eq: (c: string, v: string) => {
                maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
              };
            };
          };
        };
      }
    )
      .from("incidents")
      .select(
        "id,title,description,source,affected_service_id,status,severity,started_at,updated_at,resolved_at,resolution_summary",
      )
      .eq("id", incidentId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (incRes.error || !incRes.data) {
      return NextResponse.json({ error: "Incident not found." }, { status: 404 });
    }

    const row = incRes.data as Record<string, unknown>;
    const incident: Incident = {
      id: String(row.id),
      title: String(row.title),
      description: row.description != null ? String(row.description) : undefined,
      source: (row.source as Incident["source"]) ?? "manual",
      affectedServiceId: String(row.affected_service_id),
      status: row.status as Incident["status"],
      severity: row.severity as Incident["severity"],
      startedAt: String(row.started_at),
      updatedAt: String(row.updated_at),
      resolvedAt: row.resolved_at != null ? String(row.resolved_at) : undefined,
      resolutionSummary:
        row.resolution_summary != null ? String(row.resolution_summary) : undefined,
    };

    const svcRes = await (
      admin as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (c: string, v: string) => Promise<{ data: unknown; error: unknown }>;
          };
        };
      }
    )
      .from("services")
      .select("id,name")
      .eq("workspace_id", workspace.id);

    const serviceRows = (svcRes.data ?? []) as { id: string; name: string }[];
    const serviceName =
      serviceRows.find((r) => r.id === incident.affectedServiceId)?.name ?? "Unknown service";

    const result = await runIncidentAssist({
      action,
      incident,
      serviceName,
      optionalNotes: body.notes?.trim() || undefined,
    });

    if ("error" in result) {
      const status = result.code === "ai_not_configured" ? 503 : 502;
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status },
      );
    }

    return NextResponse.json({ ok: true, text: result.text });
  } catch {
    return NextResponse.json({ error: "Request failed." }, { status: 500 });
  }
}
