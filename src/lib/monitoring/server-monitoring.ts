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
  timeout_ms: number | null;
  failure_threshold: number | null;
  retry_count: number | null;
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
  incident_email_alerts_enabled: boolean | null;
  maintenance_email_alerts_enabled: boolean | null;
  discord_webhook_url: string | null;
  alert_email: string | null;
  support_email: string | null;
};

type SubscriberRow = {
  workspace_id: string;
  email: string;
  incident_created: boolean | null;
  incident_resolved: boolean | null;
  active: boolean | null;
};

type MaintenanceRow = {
  id: string;
  workspace_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  affected_service_ids: string[] | null;
  status: "scheduled" | "active" | "completed" | "cancelled";
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

function hasErrorCode(error: unknown, code: string): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const value = error as { code?: unknown };
  return value.code === code;
}

function createMonitoringIncidentId(serviceId: string): string {
  const random = crypto.randomUUID().split("-")[0];
  return `inc_auto_${serviceId}_${random}`;
}

function createIncidentEventId(incidentId: string): string {
  return `evt_${incidentId}_${crypto.randomUUID().split("-")[0]}`;
}

function isMaintenanceActiveForService(
  maintenanceRows: MaintenanceRow[],
  workspaceId: string,
  serviceId: string,
): MaintenanceRow | null {
  const now = Date.now();
  for (const row of maintenanceRows) {
    if (row.workspace_id !== workspaceId) {
      continue;
    }
    if (row.status !== "active") {
      continue;
    }
    const startsAt = new Date(row.starts_at).getTime();
    const endsAt = new Date(row.ends_at).getTime();
    if (!(startsAt <= now && now <= endsAt)) {
      continue;
    }
    const affected = row.affected_service_ids ?? [];
    if (affected.length === 0 || affected.includes(serviceId)) {
      return row;
    }
  }
  return null;
}

export async function runServerMonitoringCycle({
  supabase,
  logger = console,
}: {
  supabase: unknown;
  logger?: Logger;
}) {
  const db = supabase as SupabaseAdminClient;
  let servicesResult = await db
    .from("services")
    .select(
      "id,user_id,workspace_id,name,url,status,consecutive_failures,timeout_ms,failure_threshold,retry_count",
    )
    .order("created_at", { ascending: false });

  if (servicesResult.error && hasErrorCode(servicesResult.error, "42703")) {
    servicesResult = await db
      .from("services")
      .select("id,user_id,workspace_id,name,url,status,consecutive_failures")
      .order("created_at", { ascending: false });
  }

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

  let workspaceNotificationResult = await db
    .from("workspaces")
    .select(
      "id,user_id,name,incident_alerts_enabled,incident_email_alerts_enabled,maintenance_email_alerts_enabled,discord_webhook_url,alert_email,support_email",
    )
    .order("created_at", { ascending: false });

  if (workspaceNotificationResult.error && hasErrorCode(workspaceNotificationResult.error, "42703")) {
    workspaceNotificationResult = await db
      .from("workspaces")
      .select("id,user_id,name,incident_alerts_enabled,discord_webhook_url")
      .order("created_at", { ascending: false });
  }

  const subscribersResult = await db
    .from("alert_subscribers")
    .select("workspace_id,email,incident_created,incident_resolved,active")
    .order("created_at", { ascending: false });

  const maintenanceResult = await db
    .from("maintenance_windows")
    .select("id,workspace_id,title,starts_at,ends_at,affected_service_ids,status")
    .order("starts_at", { ascending: false });

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

  const subscribersByWorkspace = new Map<string, SubscriberRow[]>();
  if (subscribersResult.error && !hasErrorCode(subscribersResult.error, "42P01")) {
    logger.warn("[monitor-worker] failed to load alert subscribers", {
      error: getErrorMessage(subscribersResult.error),
    });
  } else if (!subscribersResult.error) {
    for (const row of (subscribersResult.data ?? []) as SubscriberRow[]) {
      if (row.active === false) {
        continue;
      }
      const existing = subscribersByWorkspace.get(row.workspace_id) ?? [];
      existing.push(row);
      subscribersByWorkspace.set(row.workspace_id, existing);
    }
  }

  const maintenanceRows = maintenanceResult.error
    ? ([] as MaintenanceRow[])
    : ((maintenanceResult.data ?? []) as MaintenanceRow[]);
  if (maintenanceResult.error && !hasErrorCode(maintenanceResult.error, "42P01")) {
    logger.warn("[monitor-worker] failed to load maintenance windows", {
      error: getErrorMessage(maintenanceResult.error),
    });
  }

  const nowMs = Date.now();
  for (const maintenance of maintenanceRows) {
    if (maintenance.status === "cancelled") {
      continue;
    }
    const startMs = new Date(maintenance.starts_at).getTime();
    const endMs = new Date(maintenance.ends_at).getTime();
    const nextStatus: MaintenanceRow["status"] =
      nowMs < startMs ? "scheduled" : nowMs <= endMs ? "active" : "completed";
    if (nextStatus !== maintenance.status) {
      const statusUpdate = await db
        .from("maintenance_windows")
        .update({ status: nextStatus })
        .eq("id", maintenance.id)
        .eq("id", maintenance.id);
      if (statusUpdate.error) {
        logger.warn("[monitor-worker] failed updating maintenance status", {
          maintenanceId: maintenance.id,
          error: getErrorMessage(statusUpdate.error),
        });
      } else {
        maintenance.status = nextStatus;
      }
    }
  }

  const checkTasks = services.map(async (service) => {
    const timeoutMs = Math.max(1000, service.timeout_ms ?? 10000);
    const failureThreshold = Math.max(1, service.failure_threshold ?? 3);
    const result = await runHttpCheck(service.url, timeoutMs);
    const previousStatus = service.status;
    const previousFailureCount = service.consecutive_failures ?? 0;
    const nextFailureCount = result.status === "down" ? previousFailureCount + 1 : 0;
    logger.info("[monitor-worker] raw-result", {
      serviceId: service.id,
      url: service.url,
      previousStatus,
      previousFailureCount,
      nextFailureCount,
      failureThreshold,
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
    const activeMaintenance = isMaintenanceActiveForService(
      maintenanceRows,
      service.workspace_id,
      service.id,
    );
    const workspaceSubscribers = subscribersByWorkspace.get(service.workspace_id) ?? [];

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

    if (result.status === "down" && activeMaintenance) {
      logger.info("[monitor-worker] incident suppressed during maintenance", {
        serviceId: service.id,
        maintenanceId: activeMaintenance.id,
        maintenanceTitle: activeMaintenance.title,
      });
      return;
    }

    if (result.status === "down" && nextFailureCount >= failureThreshold && !activeIncident) {
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
        await db.from("incident_events").insert({
          id: createIncidentEventId(incidentId),
          user_id: service.user_id,
          workspace_id: service.workspace_id,
          incident_id: incidentId,
          event_type: "created",
          source: "monitoring",
          message: `Monitoring detected ${nextFailureCount} consecutive failures.`,
          created_at: now,
        });
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
              incidentEmailAlertsEnabled:
                workspaceSettings.incident_email_alerts_enabled ?? false,
              maintenanceEmailAlertsEnabled:
                workspaceSettings.maintenance_email_alerts_enabled ?? false,
              discordWebhookUrl: workspaceSettings.discord_webhook_url ?? undefined,
              alertEmail: workspaceSettings.alert_email ?? undefined,
              supportEmail: workspaceSettings.support_email ?? undefined,
            },
            subscriberEmails: workspaceSubscribers
              .filter((subscriber) => subscriber.incident_created ?? true)
              .map((subscriber) => subscriber.email),
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
        await db.from("incident_events").insert({
          id: createIncidentEventId(activeIncident.id),
          user_id: service.user_id,
          workspace_id: service.workspace_id,
          incident_id: activeIncident.id,
          event_type: "resolved",
          source: "monitoring",
          message: `Monitoring confirmed recovery at ${result.responseTimeMs} ms.`,
          created_at: now,
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
              incidentEmailAlertsEnabled:
                workspaceSettings.incident_email_alerts_enabled ?? false,
              maintenanceEmailAlertsEnabled:
                workspaceSettings.maintenance_email_alerts_enabled ?? false,
              discordWebhookUrl: workspaceSettings.discord_webhook_url ?? undefined,
              alertEmail: workspaceSettings.alert_email ?? undefined,
              supportEmail: workspaceSettings.support_email ?? undefined,
            },
            subscriberEmails: workspaceSubscribers
              .filter((subscriber) => subscriber.incident_resolved ?? true)
              .map((subscriber) => subscriber.email),
            logger,
          });
        }
      }
    }
  });

  await Promise.allSettled(checkTasks);
}
