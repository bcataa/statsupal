import { readMonitorHeartbeatFromDb } from "@/lib/monitoring/monitor-heartbeat";
import { getMonitorRuntimeMemorySnapshot } from "@/lib/monitoring/monitor-runtime-memory";
import { publicRateLimitExceeded } from "@/lib/rate-limit/public-rate-limit-response";

function isServerMonitorLoopEnabled(): boolean {
  const override = process.env.ENABLE_SERVER_MONITORING_LOOP;
  if (override === "true") {
    return true;
  }
  if (override === "false") {
    return false;
  }
  return process.env.NODE_ENV === "production";
}

export async function GET(request: Request) {
  const limited = publicRateLimitExceeded(request, "health:monitoring");
  if (limited) {
    return limited;
  }

  const monitorIntervalMs = Number(process.env.MONITOR_INTERVAL_MS ?? "60000");
  const mem = getMonitorRuntimeMemorySnapshot();
  const database = await readMonitorHeartbeatFromDb();

  const lastCompletedIso = database?.lastCycleCompletedAt ?? mem.lastCycleCompletedAt;
  let stale = false;
  let staleReason: string | null = null;

  if (isServerMonitorLoopEnabled() && lastCompletedIso) {
    const ageMs = Date.now() - new Date(lastCompletedIso).getTime();
    const threshold = monitorIntervalMs * 2.5;
    if (ageMs > threshold) {
      stale = true;
      staleReason = `last cycle completion is older than ${Math.round(threshold / 1000)}s (check worker or ENABLE_SERVER_MONITORING_LOOP)`;
    }
  }

  return Response.json({
    ok: !stale,
    loopEnabled: isServerMonitorLoopEnabled(),
    monitorIntervalMs,
    process: {
      lastCycleStartedAt: mem.lastCycleStartedAt,
      lastCycleCompletedAt: mem.lastCycleCompletedAt,
      lastCycleError: mem.lastCycleError,
      lastServicesChecked: mem.lastServicesChecked,
      loopMarkedStartedAt: mem.loopMarkedStartedAt,
    },
    database,
    stale,
    staleReason,
    note:
      "process reflects this Node instance only; database reflects the last monitor heartbeat when Supabase is configured and migrations are applied.",
  });
}
