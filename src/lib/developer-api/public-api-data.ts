import { dispatchAutomationWebhooks } from "@/lib/automations/dispatch";
import { loadPublicUptimeBars24h, loadPublicWorkspaceUptime } from "@/lib/status/public-uptime";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Incident, IncidentSeverity, IncidentStatus, Service } from "@/lib/models/monitoring";

type Admin = ReturnType<typeof createAdminClient>;

function asAdmin(): Admin {
  return createAdminClient();
}

export async function fetchWorkspaceStatusJson(workspaceId: string): Promise<{
  services: {
    id: string;
    name: string;
    status: Service["status"];
    is_published: boolean;
    last_checked: string | null;
  }[];
}> {
  const db = asAdmin() as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (c: string, v: string) => Promise<{ data: unknown; error: unknown }>;
      };
    };
  };

  const res = await db
    .from("services")
    .select("id,name,status,is_published,last_checked")
    .eq("workspace_id", workspaceId);

  if (res.error) {
    throw new Error("fetch_failed");
  }

  const rows = (res.data ?? []) as {
    id: string;
    name: string;
    status: Service["status"];
    is_published: boolean | null;
    last_checked: string | null;
  }[];

  return {
    services: rows.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      is_published: r.is_published ?? true,
      last_checked: r.last_checked,
    })),
  };
}

export async function fetchWorkspaceIncidentsJson(workspaceId: string): Promise<{ incidents: Incident[] }> {
  const db = asAdmin() as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (c: string, v: string) => {
          order: (c: string, o: { ascending: boolean }) => {
            limit: (n: number) => Promise<{ data: unknown; error: unknown }>;
          };
        };
      };
    };
  };

  const res = await db
    .from("incidents")
    .select(
      "id,title,description,source,affected_service_id,status,severity,started_at,updated_at,resolved_at,resolution_summary",
    )
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (res.error) {
    throw new Error("fetch_failed");
  }

  const rows = (res.data ?? []) as Record<string, unknown>[];
  const incidents: Incident[] = rows.map((row) => ({
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
  }));

  return { incidents };
}

export async function fetchWorkspaceUptimeJson(workspaceId: string): Promise<{
  windows: Awaited<ReturnType<typeof loadPublicWorkspaceUptime>>;
  bars24h: Awaited<ReturnType<typeof loadPublicUptimeBars24h>>;
  publishedServiceIds: string[];
}> {
  const db = asAdmin() as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (c: string, v: string) => Promise<{ data: unknown; error: unknown }>;
      };
    };
  };

  const svc = await db
    .from("services")
    .select("id,is_published")
    .eq("workspace_id", workspaceId);

  if (svc.error) {
    throw new Error("fetch_failed");
  }

  const rows = (svc.data ?? []) as { id: string; is_published: boolean | null }[];
  const publishedServiceIds = rows.filter((r) => r.is_published !== false).map((r) => r.id);

  const admin = asAdmin();
  const windows = await loadPublicWorkspaceUptime(admin, workspaceId, publishedServiceIds);
  const bars24h = await loadPublicUptimeBars24h(admin, publishedServiceIds);

  return { windows, bars24h, publishedServiceIds };
}

export async function insertIncidentForWorkspace(
  workspaceId: string,
  userId: string,
  body: {
    title: string;
    description?: string;
    affectedServiceId: string;
    severity: IncidentSeverity;
    status?: IncidentStatus;
  },
): Promise<{ id: string }> {
  const db = asAdmin() as {
    from: (t: string) => {
      insert: (row: Record<string, unknown>) => {
        select: (c: string) => {
          single: () => Promise<{ data: unknown; error: unknown }>;
        };
      };
    };
  };

  const now = new Date().toISOString();
  const id = `inc_api_${crypto.randomUUID().split("-")[0]}`;

  const res = await db
    .from("incidents")
    .insert({
      id,
      user_id: userId,
      workspace_id: workspaceId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      source: "manual",
      affected_service_id: body.affectedServiceId,
      status: body.status ?? "investigating",
      severity: body.severity,
      started_at: now,
      updated_at: now,
      resolved_at: null,
      resolution_summary: null,
    })
    .select("id")
    .single();

  if (res.error || !res.data) {
    throw new Error("insert_failed");
  }

  const incidentId = (res.data as { id: string }).id;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adb = asAdmin() as any;
    const svcRes = await adb
      .from("services")
      .select("name")
      .eq("id", body.affectedServiceId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    const serviceName = (svcRes.data as { name?: string } | null)?.name ?? "Service";
    void dispatchAutomationWebhooks({
      trigger: "incident_created",
      workspaceId,
      userId,
      serviceId: body.affectedServiceId,
      serviceName,
      status: body.status ?? "investigating",
      incidentId,
    }).catch(() => {});
  } catch {
    /* automation is best-effort */
  }

  return { id: incidentId };
}

export async function insertMaintenanceForWorkspace(
  workspaceId: string,
  userId: string,
  body: {
    title: string;
    description?: string;
    startsAt: string;
    endsAt: string;
    affectedServiceIds: string[];
  },
): Promise<{ id: string }> {
  const db = asAdmin() as {
    from: (t: string) => {
      insert: (row: Record<string, unknown>) => {
        select: (c: string) => {
          single: () => Promise<{ data: unknown; error: unknown }>;
        };
      };
    };
  };

  const id = `mnt_api_${crypto.randomUUID().split("-")[0]}`;
  const res = await db
    .from("maintenance_windows")
    .insert({
      id,
      user_id: userId,
      workspace_id: workspaceId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      starts_at: body.startsAt,
      ends_at: body.endsAt,
      affected_service_ids: body.affectedServiceIds,
      status: "scheduled",
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (res.error || !res.data) {
    throw new Error("insert_failed");
  }

  return { id: (res.data as { id: string }).id };
}

export async function serviceBelongsToWorkspace(
  serviceId: string,
  workspaceId: string,
): Promise<boolean> {
  const db = asAdmin() as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (c: string, v: string) => {
          eq: (c: string, v: string) => {
            maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
          };
        };
      };
    };
  };

  const res = await db
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  return Boolean(res.data);
}
