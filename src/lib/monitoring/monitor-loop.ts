import { logMonitoring } from "@/lib/logging/server-log";
import { runServerMonitoringCycle } from "@/lib/monitoring/server-monitoring";
import { markMonitorLoopProcessStarted } from "@/lib/monitoring/monitor-runtime-memory";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * In-process monitoring loop for Next.js on Railway.
 *
 * Run exactly ONE instance that performs checks (either this loop with ENABLE_SERVER_MONITORING_LOOP=true,
 * or the separate `src/worker/monitoring-worker.ts` process — never both). Multiple writers cause duplicate
 * checks and duplicate incidents. Rate limits and the in-memory monitor snapshot are per-process only;
 * cross-instance coordination is not implemented.
 */
const MONITOR_INTERVAL_MS = Number(process.env.MONITOR_INTERVAL_MS ?? "60000");

type MonitorLoopState = {
  started: boolean;
  running: boolean;
  stopped: boolean;
  timer: ReturnType<typeof setTimeout> | null;
  stop: () => void;
};

declare global {
  var __statsupalMonitorLoop: MonitorLoopState | undefined;
}

function isLoopEnabled(): boolean {
  const override = process.env.ENABLE_SERVER_MONITORING_LOOP;
  if (override === "true") {
    return true;
  }
  if (override === "false") {
    return false;
  }
  return process.env.NODE_ENV === "production";
}

export function startMonitoringLoop() {
  if (globalThis.__statsupalMonitorLoop?.started) {
    return;
  }

  if (!isLoopEnabled()) {
    logMonitoring.info("server monitor loop disabled by configuration");
    return;
  }

  const state: MonitorLoopState = {
    started: true,
    running: false,
    stopped: false,
    timer: null,
    stop: () => {
      if (state.stopped) {
        return;
      }
      state.stopped = true;
      if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
      }
      process.off("SIGTERM", state.stop);
      process.off("SIGINT", state.stop);
      logMonitoring.info("server monitor loop stopped");
    },
  };

  globalThis.__statsupalMonitorLoop = state;
  markMonitorLoopProcessStarted();

  const scheduleNextRun = () => {
    if (state.stopped) {
      return;
    }
    logMonitoring.info("scheduling next monitoring cycle");
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = null;
    }
    state.timer = setTimeout(() => {
      void runCycle();
    }, MONITOR_INTERVAL_MS);
    logMonitoring.info("next monitoring cycle scheduled", {
      intervalMs: MONITOR_INTERVAL_MS,
    });
  };

  const runCycle = async () => {
    if (state.stopped) {
      return;
    }
    if (state.running) {
      logMonitoring.warn("monitoring cycle already running; skipping overlap");
      return;
    }

    state.running = true;
    logMonitoring.info("monitoring loop tick started");
    try {
      const supabase = createAdminClient();
      await runServerMonitoringCycle({ supabase });
      logMonitoring.info("monitoring loop tick completed");
    } catch (error) {
      logMonitoring.error("monitoring loop tick failed — will retry on next schedule", {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      state.running = false;
      scheduleNextRun();
    }
  };

  process.on("SIGTERM", state.stop);
  process.on("SIGINT", state.stop);
  logMonitoring.info("server monitor loop started");
  void runCycle();
}
