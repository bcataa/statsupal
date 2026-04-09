import { logMonitoring } from "@/lib/logging/server-log";
import { createAdminClient, getMonitoringEnv } from "@/lib/supabase/admin";

function hasErrorCode(error: unknown, code: string): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  return (error as { code?: string }).code === code;
}

type HeartbeatPatch = {
  last_cycle_started_at?: string | null;
  last_cycle_completed_at?: string | null;
  services_checked?: number | null;
  last_error?: string | null;
};

/**
 * Partial update to the single `monitor_heartbeat` row. Safe no-op if Supabase is not configured
 * or the table does not exist yet.
 */
export async function updateMonitorHeartbeatRow(patch: HeartbeatPatch): Promise<void> {
  try {
    getMonitoringEnv();
  } catch {
    return;
  }

  try {
    const admin = createAdminClient() as {
      from: (t: string) => {
        update: (row: Record<string, unknown>) => {
          eq: (c: string, v: string) => Promise<{ error: unknown }>;
        };
      };
    };

    const updated_at = new Date().toISOString();
    const result = await admin
      .from("monitor_heartbeat")
      .update({ ...patch, updated_at })
      .eq("id", "default");

    if (result.error && hasErrorCode(result.error, "42P01")) {
      return;
    }
    if (result.error) {
      logMonitoring.warn("monitor heartbeat update failed", {
        message: String((result.error as { message?: string }).message ?? result.error),
      });
    }
  } catch (error) {
    logMonitoring.warn("monitor heartbeat not persisted", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function readMonitorHeartbeatFromDb(): Promise<{
  lastCycleStartedAt: string | null;
  lastCycleCompletedAt: string | null;
  servicesChecked: number | null;
  lastError: string | null;
  updatedAt: string | null;
} | null> {
  try {
    getMonitoringEnv();
  } catch {
    return null;
  }

  try {
    const admin = createAdminClient() as {
      from: (t: string) => {
        select: (...args: unknown[]) => {
          eq: (...args: unknown[]) => {
            maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
          };
        };
      };
    };

    const res = await admin.from("monitor_heartbeat").select("*").eq("id", "default").maybeSingle();
    if (res.error || !res.data) {
      return null;
    }
    const d = res.data as {
      last_cycle_started_at?: string | null;
      last_cycle_completed_at?: string | null;
      services_checked?: number | null;
      last_error?: string | null;
      updated_at?: string | null;
    };
    return {
      lastCycleStartedAt: d.last_cycle_started_at ?? null,
      lastCycleCompletedAt: d.last_cycle_completed_at ?? null,
      servicesChecked: d.services_checked ?? null,
      lastError: d.last_error ?? null,
      updatedAt: d.updated_at ?? null,
    };
  } catch {
    return null;
  }
}

/** Optional external URL (e.g. UptimeRobot, healthchecks.io) pinged after a successful cycle. */
export function fireOptionalMonitorWebhook(): void {
  const url = process.env.MONITOR_HEARTBEAT_WEBHOOK_URL?.trim();
  if (!url) {
    return;
  }
  void (async () => {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "statsupal_monitor_cycle_complete",
          at: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      // Never fail monitoring because of an optional webhook
    }
  })();
}
