import { runServerMonitoringCycle } from "@/lib/monitoring/server-monitoring";
import { createAdminClient, getMonitoringEnv } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const source =
      request.headers.get("x-monitor-source") ||
      (request.headers.get("user-agent")?.includes("vercel-cron") ? "vercel-cron" : "server");
    // Validate all required monitoring env vars before starting checks.
    getMonitoringEnv();
    const supabase = createAdminClient();
    console.log("[api/monitor] monitoring cycle started", { source });
    await runServerMonitoringCycle({ supabase });
    return Response.json({
      success: true,
      source,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown monitoring error";
    console.error("[api/monitor] run failed", {
      message,
      error,
    });
    return Response.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    );
  }
}
