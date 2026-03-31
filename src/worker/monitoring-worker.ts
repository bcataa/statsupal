import { runServerMonitoringCycle } from "@/lib/monitoring/server-monitoring";
import { createAdminClient } from "@/lib/supabase/admin";

const intervalMs = Number(process.env.MONITOR_INTERVAL_MS ?? "60000");

async function run() {
  const supabase = createAdminClient();

  console.info("[monitor-worker] started", {
    intervalMs,
    startedAt: new Date().toISOString(),
  });

  await runServerMonitoringCycle({ supabase });

  setInterval(() => {
    void runServerMonitoringCycle({ supabase });
  }, intervalMs);
}

void run();
