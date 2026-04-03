import { runServerMonitoringCycle } from "@/lib/monitoring/server-monitoring";
import { createAdminClient } from "@/lib/supabase/admin";

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
    console.log("[monitor-loop] disabled");
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
      console.log("[monitor-loop] stopped");
    },
  };

  globalThis.__statsupalMonitorLoop = state;

  const runCycle = async () => {
    if (state.stopped || state.running) {
      return;
    }

    state.running = true;
    console.log("[monitor-loop] running cycle");
    try {
      const supabase = createAdminClient();
      await runServerMonitoringCycle({ supabase });
      console.log("[monitor-loop] cycle complete");
    } catch (error) {
      console.error("[monitor-loop] cycle failed", error);
    } finally {
      state.running = false;
      if (!state.stopped) {
        state.timer = setTimeout(() => {
          void runCycle();
        }, MONITOR_INTERVAL_MS);
      }
    }
  };

  process.on("SIGTERM", state.stop);
  process.on("SIGINT", state.stop);
  console.log("[monitor-loop] started");
  void runCycle();
}
