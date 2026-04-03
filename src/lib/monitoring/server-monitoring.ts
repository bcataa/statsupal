import { runHttpCheck } from "@/lib/monitoring/monitor";
import { notifyIncidentEvent } from "@/lib/monitoring/notifications";
import type { Incident, Service } from "@/lib/models/monitoring";

type Logger = Pick<Console, "info" | "warn" | "error">;

type SupabaseAdminClient = {
  from: (table: string) => {
    select: (...args: unknown[]) => {
      order: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
      neq: (...args: unknown[]) => {
        order: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
      };
    };
    update: (...args: unknown[]) => {
      eq: (...args: unknown[]) => {
        eq: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
      };
    };
    insert: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
  };
};

type ServiceRow = {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  url: string;
  status: Service["status"];
  consecutive_failures: number | null;
};

type IncidentRow = {
  id: string;
  user_id: string;
  workspace_id: string;
  affected_service_id: string;
  status: Incident["status"];
};

type WorkspaceNotificationRow = {
  id: string;
  user_id: string;
  name: string;
  incident_alerts_enabled: boolean | null;
  discord_webhook_url: string | null;
};

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Unknown Supabase error";
  }

  const value = error as { message?: unknown };
  return typeof value.message === "string" ? value.message : "Unknown Supabase error";
}

function isDuplicateError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const value = error as { code?: unknown };
  return value.code === "23505";
}

function createMonitoringIncidentId(serviceId: string): string {
  const random = crypto.randomUUID().split("-")[0];
  return `inc_auto_${serviceId}_${random}`;
}

export async function runServerMonitoringCycle({
  supabase,
  logger = console,
}: {
  supabase: unknown;
  logger?: Logger;
}) {
  const db = supabase as SupabaseAdminClient;
  const servicesResult = await db
    .from("services")
    .select("id,user_id,workspace_id,name,url,status,consecutive_failures")
    .order("created_at", { ascending: false });

  if (servicesResult.error) {
    logger.error("[monitor-worker] failed to load services", {
      error: getErrorMessage(servicesResult.error),
    });
    return;
  }

  const services = (servicesResult.data ?? []) as ServiceRow[];
  if (services.length === 0) {
    logger.info("[monitor-worker] no services found");
    return;
  }

  const incidentsResult = await db
    .from("incidents")
    .select("id,user_id,workspace_id,affected_service_id,status")
    .neq("status", "resolved")
    .order("updated_at", { ascending: false });

  if (incidentsResult.error) {
    logger.error("[monitor-worker] failed to load active incidents", {
      error: getErrorMessage(incidentsResult.error),
    });
    return;
  }

  const activeByServiceId = new Map<string, IncidentRow>();
  for (const incident of (incidentsResult.data ?? []) as IncidentRow[]) {
    if (!activeByServiceId.has(incident.affected_service_id)) {
      activeByServiceId.set(incident.affected_service_id, incident);
    }
  }

  const workspaceNotificationResult = await db
    .from("workspaces")
    .select("id,user_id,name,incident_alerts_enabled,discord_webhook_url")
    .order("created_at", { ascending: false });

  const workspaceById = new Map<string, WorkspaceNotificationRow>();
  if (workspaceNotificationResult.error) {
    logger.warn("[monitor-worker] failed to load workspace notification settings", {
      error: getErrorMessage(workspaceNotificationResult.error),
    });
  } else {
    for (const row of (workspaceNotificationResult.data ?? []) as WorkspaceNotificationRow[]) {
      workspaceById.set(row.id, row);
    }
  }

  const checkTasks = services.map(async (service) => {
    const result = await runHttpCheck(service.url);
    const previousStatus = service.status;
    const previousFailureCount = service.consecutive_failures ?? 0;
    const nextFailureCount = result.status === "down" ? previousFailureCount + 1 : 0;
    logger.info("[monitor-worker] raw-result", {
      serviceId: service.id,
      url: service.url,
      previousStatus,
      previousFailureCount,
      nextFailureCount,
      mappedStatus: result.status,
      httpStatus: result.httpStatus,
      errorReason: result.errorReason,
      responseTimeMs: result.responseTimeMs,
      lastChecked: result.lastChecked,
      responseHeaders: result.responseHeaders,
    });

    const updateResult = await db
      .from("services")
      .update({
        status: result.status,
        response_time_ms: result.responseTimeMs,
        last_checked: result.lastChecked,
        consecutive_failures: nextFailureCount,
      })
      .eq("id", service.id)
      .eq("user_id", service.user_id);

    if (updateResult.error) {
      logger.error("[monitor-worker] failed updating service status", {
        serviceId: service.id,
        error: getErrorMessage(updateResult.error),
      });
      return;
    }
    logger.info("[monitor-worker] service status persisted", {
      serviceId: service.id,
      status: result.status,
      responseTimeMs: result.responseTimeMs,
      lastChecked: result.lastChecked,
      consecutiveFailures: nextFailureCount,
    });

    const historyInsert = await db.from("service_check_history").insert({
      id: `chk_${service.id}_${crypto.randomUUID().split("-")[0]}`,
      service_id: service.id,
      user_id: service.user_id,
      workspace_id: service.workspace_id,
      status: result.status,
      response_time_ms: result.responseTimeMs,
      checked_at: result.lastChecked,
    });

    if (historyInsert.error) {
      logger.warn("[monitor-worker] failed writing service history row", {
        serviceId: service.id,
        error: getErrorMessage(historyInsert.error),
      });
    }

    const activeIncident = activeByServiceId.get(service.id);
    const workspaceSettings = workspaceById.get(service.workspace_id);

    if (result.status === "down" && nextFailureCount === 1) {
      logger.info("[monitor-worker] first failure recorded", {
        serviceId: service.id,
      });
    }
    if (result.status === "down" && nextFailureCount > 1) {
      logger.info("[monitor-worker] repeated failure count", {
        serviceId: service.id,
        consecutiveFailures: nextFailureCount,
      });
    }

    if (result.status === "down" && nextFailureCount >= 3 && !activeIncident) {
      const now = new Date().toISOString();
      const incidentId = createMonitoringIncidentId(service.id);
      const incidentTitle = `${service.name} is down`;
      const incidentInsert = await db.from("incidents").insert({
        id: incidentId,
        user_id: service.user_id,
        workspace_id: service.workspace_id,
        title: incidentTitle,
        description: `Automated monitor detected ${nextFailureCount} consecutive failures for ${service.url}.`,
        source: "monitoring",
        affected_service_id: service.id,
        status: "investigating",
        severity: "major",
        started_at: now,
        updated_at: now,
      });

      if (incidentInsert.error && !isDuplicateError(incidentInsert.error)) {
        logger.error("[monitor-worker] failed creating incident", {
          serviceId: service.id,
          error: getErrorMessage(incidentInsert.error),
        });
      } else {
        logger.info("[monitor-worker] incident created", { serviceId: service.id });
        if (workspaceSettings) {
          await notifyIncidentEvent({
            event: "created",
            service: {
              id: service.id,
              name: service.name,
              url: service.url,
            },
            incident: {
              id: incidentId,
              title: incidentTitle,
              status: "investigating",
              severity: "major",
            },
            workspace: {
              workspaceName: workspaceSettings.name,
              incidentAlertsEnabled: workspaceSettings.incident_alerts_enabled ?? true,
              discordWebhookUrl: workspaceSettings.discord_webhook_url ?? undefined,
            },
            logger,
          });
        }
      }

      return;
    }

    if (result.status !== "down" && previousFailureCount > 0 && !activeIncident) {
      logger.info("[monitor-worker] transient failure recovered before incident threshold", {
        serviceId: service.id,
        previousFailureCount,
      });
    }

    if (
      (result.status === "operational" || result.status === "degraded") &&
      activeIncident
    ) {
      const now = new Date().toISOString();
      const resolveResult = await db
        .from("incidents")
        .update({
          status: "resolved",
          updated_at: now,
          resolved_at: now,
          resolution_summary: `Auto-resolved after recovery check (${result.responseTimeMs} ms).`,
        })
        .eq("id", activeIncident.id)
        .eq("user_id", service.user_id);

      if (resolveResult.error) {
        logger.error("[monitor-worker] failed resolving incident", {
          incidentId: activeIncident.id,
          error: getErrorMessage(resolveResult.error),
        });
      } else {
        logger.info("[monitor-worker] incident resolved", {
          incidentId: activeIncident.id,
          serviceId: service.id,
        });
        if (workspaceSettings) {
          await notifyIncidentEvent({
            event: "resolved",
            service: {
              id: service.id,
              name: service.name,
              url: service.url,
            },
            incident: {
              id: activeIncident.id,
              title: `${service.name} recovered`,
              status: "resolved",
              severity: "major",
              resolutionSummary: `Recovered with ${result.responseTimeMs} ms response time.`,
            },
            workspace: {
              workspaceName: workspaceSettings.name,
              incidentAlertsEnabled: workspaceSettings.incident_alerts_enabled ?? true,
              discordWebhookUrl: workspaceSettings.discord_webhook_url ?? undefined,
            },
            logger,
          });
        }
      }
    }
  });

  await Promise.allSettled(checkTasks);
}
