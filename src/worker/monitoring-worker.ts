/**
 * Standalone monitoring worker for Railway (or any Node host).
 *
 * Deploy as a single service/replica. Do not scale this horizontally without changing the
 * architecture — duplicate instances will duplicate checks and can create duplicate incidents.
 * If you use this worker, set ENABLE_SERVER_MONITORING_LOOP=false on the web app so only one
 * process runs the monitoring loop.
 */

import { logMonitoring } from "@/lib/logging/server-log";
import { runServerMonitoringCycle } from "@/lib/monitoring/server-monitoring";
import { markMonitorLoopProcessStarted } from "@/lib/monitoring/monitor-runtime-memory";
import { createAdminClient } from "@/lib/supabase/admin";

const intervalMs = Number(process.env.MONITOR_INTERVAL_MS ?? "60000");

let cycleRunning = false;

async function runOneCycle(supabase: unknown): Promise<void> {
  if (cycleRunning) {
    logMonitoring.warn("monitor worker skipped tick — previous cycle still running");
    return;
  }
  cycleRunning = true;
  try {
    await runServerMonitoringCycle({ supabase });
  } catch (error) {
    logMonitoring.error("monitor worker cycle threw — continuing on interval", {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    cycleRunning = false;
  }
}

async function run() {
  markMonitorLoopProcessStarted();
  const supabase = createAdminClient();

  logMonitoring.info("monitor worker process started", {
    intervalMs,
    startedAt: new Date().toISOString(),
  });

  await runOneCycle(supabase);

  setInterval(() => {
    void runOneCycle(supabase);
  }, intervalMs);
}

void run();
