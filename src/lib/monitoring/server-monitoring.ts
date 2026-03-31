import { runHttpCheck } from "@/lib/monitoring/monitor";
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
};

type IncidentRow = {
  id: string;
  user_id: string;
  workspace_id: string;
  affected_service_id: string;
  status: Incident["status"];
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
    .select("id,user_id,workspace_id,name,url,status")
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

  const checkTasks = services.map(async (service) => {
    const result = await runHttpCheck(service.url);
    const previousStatus = service.status;
    logger.info("[monitor-worker] raw-result", {
      serviceId: service.id,
      url: service.url,
      previousStatus,
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
    });

    const activeIncident = activeByServiceId.get(service.id);

    if (previousStatus !== "down" && result.status === "down" && !activeIncident) {
      const now = new Date().toISOString();
      const incidentInsert = await db.from("incidents").insert({
        id: createMonitoringIncidentId(service.id),
        user_id: service.user_id,
        workspace_id: service.workspace_id,
        title: `${service.name} is down`,
        description: `Automated monitor failed to reach ${service.url}.`,
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
      }

      return;
    }

    if (
      previousStatus === "down" &&
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
          resolution_summary: `Auto-resolved after successful monitor check (${result.responseTimeMs} ms).`,
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
      }
    }
  });

  await Promise.allSettled(checkTasks);
}
