import { NextResponse } from "next/server";
import { dispatchAutomationWebhooks } from "@/lib/automations/dispatch";
import type { AutomationTriggerType } from "@/lib/automations/types";
import { ensureWorkspace } from "@/lib/supabase/app-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRIGGERS = new Set<AutomationTriggerType>(["incident_created", "incident_resolved"]);

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ success: false, message: "Supabase is not configured." }, { status: 500 });
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  let body: { trigger?: string; incidentId?: string };
  try {
    body = (await request.json()) as { trigger?: string; incidentId?: string };
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON." }, { status: 400 });
  }

  const trigger = body.trigger as AutomationTriggerType | undefined;
  const incidentId = body.incidentId?.trim();
  if (!trigger || !TRIGGERS.has(trigger) || !incidentId) {
    return NextResponse.json(
      { success: false, message: "trigger (incident_created | incident_resolved) and incidentId are required." },
      { status: 400 },
    );
  }

  try {
    const workspace = await ensureWorkspace(supabase, user.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;

    type IncidentRow = {
      id: string;
      user_id: string;
      workspace_id: string;
      affected_service_id: string;
      status: string;
    };

    let incident: IncidentRow | null = null;
    for (let i = 0; i < 8; i++) {
      const res = await admin
        .from("incidents")
        .select("id,user_id,workspace_id,affected_service_id,status")
        .eq("id", incidentId)
        .maybeSingle();
      if (!res.error && res.data) {
        incident = res.data as IncidentRow;
        break;
      }
      await sleep(250);
    }

    if (!incident || incident.user_id !== user.id || incident.workspace_id !== workspace.id) {
      return NextResponse.json({ success: false, message: "Incident not found." }, { status: 404 });
    }

    if (trigger === "incident_resolved" && incident.status !== "resolved") {
      return NextResponse.json(
        { success: false, message: "Incident is not resolved yet; wait for sync or try again." },
        { status: 409 },
      );
    }

    const svc = await admin
      .from("services")
      .select("name")
      .eq("id", incident.affected_service_id)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    const serviceName = (svc.data as { name?: string } | null)?.name ?? "Service";

    await dispatchAutomationWebhooks({
      trigger,
      workspaceId: workspace.id,
      userId: user.id,
      serviceId: incident.affected_service_id,
      serviceName,
      status: incident.status,
      incidentId: incident.id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Could not run automations." }, { status: 500 });
  }
}
