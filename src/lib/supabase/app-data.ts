import type { Incident, Service } from "@/lib/models/monitoring";
import type { Workspace } from "@/lib/models/workspace";
import { toSlug } from "@/lib/utils/slug";

type SupabaseClientLike = unknown;

type DbClient = {
  from: (table: string) => {
    select: (...args: unknown[]) => {
      eq: (...args: unknown[]) => {
        maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
        order: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
        limit: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
      };
      order: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
      limit: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
    };
    insert: (...args: unknown[]) => {
      select: (...args: unknown[]) => {
        single: () => Promise<{ data: unknown; error: unknown }>;
      };
    };
    update: (...args: unknown[]) => {
      eq: (...args: unknown[]) => {
        eq: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
      };
    };
    upsert: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
    delete: () => {
      eq: (...args: unknown[]) => {
        eq: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
      };
    };
  };
};

function getDb(client: SupabaseClientLike): DbClient {
  return client as DbClient;
}

type SupabaseErrorDetails = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  stack?: string;
};

type SupabaseErrorLike = {
  message?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  stack?: unknown;
};

function getErrorDetails(error: unknown, fallbackMessage: string): SupabaseErrorDetails {
  if (!error || typeof error !== "object") {
    return { message: fallbackMessage };
  }

  const value = error as SupabaseErrorLike;
  return {
    message: typeof value.message === "string" ? value.message : fallbackMessage,
    code: typeof value.code === "string" ? value.code : undefined,
    details: typeof value.details === "string" ? value.details : undefined,
    hint: typeof value.hint === "string" ? value.hint : undefined,
    stack:
      typeof value.stack === "string"
        ? value.stack
        : error instanceof Error
          ? error.stack
          : undefined,
  };
}

function hasErrorCode(error: unknown, code: string): boolean {
  const details = getErrorDetails(error, "");
  return details.code === code;
}

function formatErrorForLog(error: unknown, fallbackMessage: string): SupabaseErrorDetails {
  return getErrorDetails(error, fallbackMessage);
}

let workspaceTableCache: "workspaces" | "workspace" | null = null;

async function resolveWorkspaceTableName(
  db: DbClient,
  userId: string,
): Promise<"workspaces" | "workspace"> {
  if (workspaceTableCache) {
    return workspaceTableCache;
  }

  const preferred = await db
    .from("workspaces")
    .select("id,user_id")
    .eq("user_id", userId)
    .limit(1);

  if (!preferred.error) {
    workspaceTableCache = "workspaces";
    return workspaceTableCache;
  }

  if (!hasErrorCode(preferred.error, "42P01")) {
    const details = formatErrorForLog(preferred.error, "Could not access workspaces table.");
    throw new Error(
      `Workspace table check failed: ${details.message} (code=${details.code ?? "unknown"})`,
    );
  }

  const singular = await db
    .from("workspace")
    .select("id,user_id")
    .eq("user_id", userId)
    .limit(1);

  if (!singular.error) {
    workspaceTableCache = "workspace";
    return workspaceTableCache;
  }

  const preferredDetails = formatErrorForLog(
    preferred.error,
    "Could not access workspaces table.",
  );
  const singularDetails = formatErrorForLog(
    singular.error,
    "Could not access workspace table.",
  );
  throw new Error(
    [
      "Neither 'workspaces' nor 'workspace' table is queryable.",
      `workspaces => ${preferredDetails.message} (code=${preferredDetails.code ?? "unknown"})`,
      `workspace => ${singularDetails.message} (code=${singularDetails.code ?? "unknown"})`,
    ].join(" "),
  );
}

async function validateUserScopedTables(db: DbClient, userId: string): Promise<void> {
  const workspaceTable = await resolveWorkspaceTableName(db, userId);
  const checks = [
    db
      .from(workspaceTable)
      .select(
        "id,user_id,name,project_name,project_slug,incident_alerts_enabled,maintenance_alerts_enabled,discord_webhook_url,custom_domain,custom_domain_status",
      )
      .eq("user_id", userId)
      .limit(1),
    db
      .from("services")
      .select(
        "id,user_id,workspace_id,name,url,status,check_type,check_interval,consecutive_failures",
      )
      .eq("user_id", userId)
      .limit(1),
    db
      .from("incidents")
      .select("id,user_id,workspace_id,title,status,severity,started_at,updated_at")
      .eq("user_id", userId)
      .limit(1),
  ] as const;

  const [workspaceResult, servicesResult, incidentsResult] = await Promise.all(checks);

  if (workspaceResult.error) {
    const details = formatErrorForLog(
      workspaceResult.error,
      `Workspace table '${workspaceTable}' schema/RLS validation failed.`,
    );
    throw new Error(
      [
        details.message,
        `code=${details.code ?? "unknown"}`,
        details.details ? `details=${details.details}` : "",
        details.hint ? `hint=${details.hint}` : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  if (servicesResult.error) {
    const details = formatErrorForLog(
      servicesResult.error,
      "Services table schema/RLS validation failed.",
    );
    throw new Error(
      [
        details.message,
        `code=${details.code ?? "unknown"}`,
        details.details ? `details=${details.details}` : "",
        details.hint ? `hint=${details.hint}` : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  if (incidentsResult.error) {
    const details = formatErrorForLog(
      incidentsResult.error,
      "Incidents table schema/RLS validation failed.",
    );
    throw new Error(
      [
        details.message,
        `code=${details.code ?? "unknown"}`,
        details.details ? `details=${details.details}` : "",
        details.hint ? `hint=${details.hint}` : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  }
}

type WorkspaceRow = {
  id: string;
  user_id: string;
  name: string;
  project_name: string;
  project_slug: string;
  incident_alerts_enabled: boolean | null;
  maintenance_alerts_enabled: boolean | null;
  discord_webhook_url: string | null;
  custom_domain: string | null;
  custom_domain_status: "unconfigured" | "pending_verification" | "verified" | "failed" | null;
  created_at: string;
};

type ServiceRow = {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  url: string;
  status: Service["status"];
  check_type: Service["checkType"];
  check_interval: string;
  last_checked: string;
  response_time_ms: number;
  description: string | null;
  created_at: string;
};

function normalizeLoadedService(service: Service): Service {
  const hasNeverChecked = !service.lastChecked || service.lastChecked.trim().length === 0;
  if (hasNeverChecked) {
    return {
      ...service,
      status: "pending",
      responseTimeMs: 0,
      lastChecked: "",
    };
  }

  if (
    (service.status === "operational" || service.status === "degraded") &&
    service.responseTimeMs <= 0
  ) {
    return {
      ...service,
      status: "down",
      responseTimeMs: 0,
    };
  }

  return service;
}

type IncidentRow = {
  id: string;
  user_id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  source: Incident["source"] | null;
  affected_service_id: string;
  status: Incident["status"];
  severity: Incident["severity"];
  started_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolution_summary: string | null;
};

function toWorkspaceModel(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    projects: [
      {
        id: `${row.id}_project`,
        name: row.project_name,
        slug: row.project_slug,
        createdAt: row.created_at,
      },
    ],
    notificationSettings: {
      incidentAlertsEnabled: row.incident_alerts_enabled ?? true,
      maintenanceAlertsEnabled: row.maintenance_alerts_enabled ?? true,
      discordWebhookUrl: row.discord_webhook_url || undefined,
    },
    domainSettings: {
      statusPageSlug: row.project_slug,
      customDomain: row.custom_domain || undefined,
      customDomainStatus: row.custom_domain_status ?? "unconfigured",
    },
  };
}

function toServiceModel(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    status: row.status,
    checkType: row.check_type,
    checkInterval: row.check_interval,
    lastChecked: row.last_checked,
    responseTimeMs: row.response_time_ms,
    description: row.description || undefined,
    createdAt: row.created_at,
  };
}

function toIncidentModel(row: IncidentRow): Incident {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    source: row.source ?? "manual",
    affectedServiceId: row.affected_service_id,
    status: row.status,
    severity: row.severity,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at || undefined,
    resolutionSummary: row.resolution_summary || undefined,
  };
}

export async function ensureWorkspace(
  client: SupabaseClientLike,
  userId: string,
): Promise<WorkspaceRow> {
  const db = getDb(client);
  const workspaceTable = await resolveWorkspaceTableName(db, userId);
  const existing = await db
    .from(workspaceTable)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data) {
    return existing.data as WorkspaceRow;
  }

  const created = await db
    .from(workspaceTable)
    .insert({
      user_id: userId,
      name: "My Workspace",
      project_name: "Main Status Page",
      project_slug: "main-status-page",
      incident_alerts_enabled: true,
      maintenance_alerts_enabled: true,
      discord_webhook_url: null,
      custom_domain: null,
      custom_domain_status: "unconfigured",
    })
    .select("*")
    .single();

  if (created.error || !created.data) {
    throw created.error ?? new Error("Could not create default workspace.");
  }

  return created.data as WorkspaceRow;
}

export async function loadUserAppData(client: SupabaseClientLike, userId: string): Promise<{
  workspace: Workspace;
  currentProjectId: string;
  services: Service[];
  incidents: Incident[];
}> {
  const db = getDb(client);
  await validateUserScopedTables(db, userId);
  const workspaceRow = await ensureWorkspace(db, userId);

  const [servicesResult, incidentsResult] = await Promise.all([
    db
      .from("services")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    db
      .from("incidents")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  if (servicesResult.error) {
    throw servicesResult.error;
  }

  if (incidentsResult.error) {
    throw incidentsResult.error;
  }

  const workspace = toWorkspaceModel(workspaceRow);
  const currentProjectId = workspace.projects[0]?.id ?? "";

  return {
    workspace,
    currentProjectId,
    services: ((servicesResult.data ?? []) as ServiceRow[])
      .map(toServiceModel)
      .map(normalizeLoadedService),
    incidents: ((incidentsResult.data ?? []) as IncidentRow[]).map(toIncidentModel),
  };
}

export async function persistWorkspaceInfo(
  client: SupabaseClientLike,
  userId: string,
  payload: {
    workspaceName?: string;
    projectName?: string;
    projectSlug?: string;
    incidentAlertsEnabled?: boolean;
    maintenanceAlertsEnabled?: boolean;
    discordWebhookUrl?: string;
    customDomain?: string;
    customDomainStatus?: "unconfigured" | "pending_verification" | "verified" | "failed";
  },
) {
  const db = getDb(client);
  const workspace = await ensureWorkspace(db, userId);
  const workspaceTable = await resolveWorkspaceTableName(db, userId);
  const nextProjectName = payload.projectName || workspace.project_name;
  const nextProjectSlug =
    payload.projectSlug || (nextProjectName ? toSlug(nextProjectName) : workspace.project_slug);

  const result = await db
    .from(workspaceTable)
    .update({
      name: payload.workspaceName || workspace.name,
      project_name: nextProjectName,
      project_slug: nextProjectSlug,
      incident_alerts_enabled:
        payload.incidentAlertsEnabled ?? workspace.incident_alerts_enabled ?? true,
      maintenance_alerts_enabled:
        payload.maintenanceAlertsEnabled ?? workspace.maintenance_alerts_enabled ?? true,
      discord_webhook_url:
        payload.discordWebhookUrl !== undefined
          ? payload.discordWebhookUrl || null
          : (workspace.discord_webhook_url ?? null),
      custom_domain:
        payload.customDomain !== undefined
          ? payload.customDomain || null
          : (workspace.custom_domain ?? null),
      custom_domain_status:
        payload.customDomainStatus ??
        workspace.custom_domain_status ??
        (payload.customDomain ? "pending_verification" : "unconfigured"),
    })
    .eq("id", workspace.id)
    .eq("user_id", userId);

  if (result.error) {
    throw result.error;
  }
}

export async function persistService(
  client: SupabaseClientLike,
  userId: string,
  workspaceId: string,
  service: Service,
) {
  const db = getDb(client);
  const basePayload = {
    id: service.id,
    user_id: userId,
    workspace_id: workspaceId,
    name: service.name,
    url: service.url,
    status: service.status,
    check_type: service.checkType,
    check_interval: service.checkInterval,
    last_checked: service.lastChecked,
    response_time_ms: service.responseTimeMs,
    description: service.description || null,
    created_at: service.createdAt,
  };

  let result = await db.from("services").upsert(basePayload, { onConflict: "id" });
  console.log("[Supabase] services.upsert response", {
    hasError: Boolean(result.error),
    error: result.error ? getErrorDetails(result.error, "Unknown upsert error.") : null,
  });

  if (result.error) {
    const details = getErrorDetails(result.error, "Failed to persist service.");
    const isPendingStatusConstraintError =
      service.status === "pending" &&
      details.code === "23514" &&
      details.message.toLowerCase().includes("services_status_check");

    // Backward compatibility: older DB schemas may not include "pending" in check constraint.
    if (isPendingStatusConstraintError) {
      result = await db.from("services").upsert(
        {
          ...basePayload,
          status: "down",
        },
        { onConflict: "id" },
      );
      console.log("[Supabase] services.upsert fallback response", {
        hasError: Boolean(result.error),
        error: result.error ? getErrorDetails(result.error, "Unknown fallback upsert error.") : null,
      });

      if (!result.error) {
        return;
      }
    }

    throw result.error;
  }
}

export async function getOrCreateWorkspaceId(
  client: SupabaseClientLike,
  userId: string,
): Promise<string> {
  const workspace = await ensureWorkspace(client, userId);
  return workspace.id;
}

export async function deleteService(
  client: SupabaseClientLike,
  userId: string,
  serviceId: string,
) {
  const db = getDb(client);
  const result = await db
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("user_id", userId);

  if (result.error) {
    throw result.error;
  }
}

export async function deleteIncident(
  client: SupabaseClientLike,
  userId: string,
  incidentId: string,
) {
  const db = getDb(client);
  const result = await db
    .from("incidents")
    .delete()
    .eq("id", incidentId)
    .eq("user_id", userId);

  if (result.error) {
    throw result.error;
  }
}

export async function persistIncident(
  client: SupabaseClientLike,
  userId: string,
  workspaceId: string,
  incident: Incident,
) {
  const db = getDb(client);
  const result = await db.from("incidents").upsert(
    {
      id: incident.id,
      user_id: userId,
      workspace_id: workspaceId,
      title: incident.title,
      description: incident.description || null,
      source: incident.source || "manual",
      affected_service_id: incident.affectedServiceId,
      status: incident.status,
      severity: incident.severity,
      started_at: incident.startedAt,
      updated_at: incident.updatedAt,
      resolved_at: incident.resolvedAt || null,
      resolution_summary: incident.resolutionSummary || null,
    },
    { onConflict: "id" },
  );

  if (result.error) {
    throw result.error;
  }
}

export function getSupabaseErrorDetails(error: unknown): SupabaseErrorDetails {
  return formatErrorForLog(error, "Unknown Supabase error.");
}
