import { runServerMonitoringCycle } from "@/lib/monitoring/server-monitoring";
import { logApi } from "@/lib/logging/server-log";
import { publicRateLimitExceeded } from "@/lib/rate-limit/public-rate-limit-response";
import { createAdminClient, getMonitoringEnv } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Manual debug endpoint only. Production scheduling is handled by monitor-loop.ts.
export async function GET(request: Request) {
  const limited = publicRateLimitExceeded(request, "monitor:get");
  if (limited) {
    return limited;
  }
  try {
    const source =
      request.headers.get("x-monitor-source") ||
      (request.headers.get("user-agent")?.includes("vercel-cron") ? "vercel-cron" : "server");
    // Validate all required monitoring env vars before starting checks.
    getMonitoringEnv();
    const supabase = createAdminClient();
    logApi.info("monitor route invoked", { source });
    await runServerMonitoringCycle({ supabase });
    return Response.json({
      success: true,
      source,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown monitoring error";
    logApi.error("monitor route failed", {
      message,
      error: error instanceof Error ? error.message : String(error),
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
