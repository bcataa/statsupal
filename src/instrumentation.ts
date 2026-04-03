export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startMonitoringLoop } = await import("@/lib/monitoring/monitor-loop");
    startMonitoringLoop();
  }
}
