import { runServerMonitoringCycle } from "@/lib/monitoring/server-monitoring";
import { createAdminClient, getMonitoringEnv } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Validate all required monitoring env vars before starting checks.
    getMonitoringEnv();
    const supabase = createAdminClient();
    await runServerMonitoringCycle({ supabase });
    return Response.json({
      success: true,
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
