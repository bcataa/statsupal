import { NextResponse } from "next/server";
import { runHttpCheck } from "@/lib/monitoring/monitor";
import type { MonitorTestMonitorKind } from "@/lib/monitoring/monitor-test-kinds";
import { createClient } from "@/lib/supabase/server";

function normalizeHttpUrl(raw: string, kind: MonitorTestMonitorKind): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  if (kind === "ping" || kind === "website" || kind === "cron") {
    return `https://${t}`;
  }
  if (kind === "tcp" || kind === "udp" || kind === "dns") {
    return `https://${t}`;
  }
  return t;
}

function friendlyMessage(errorReason?: string, httpStatus?: number): string {
  if (httpStatus && httpStatus >= 400) {
    return `The server responded with HTTP ${httpStatus}. Check the URL and that the service allows our checks.`;
  }
  if (errorReason === "timeout") {
    return "The request timed out. The host may be slow or blocking automated checks.";
  }
  if (errorReason === "non_success_http_status") {
    return "We reached the server, but the response was not successful.";
  }
  return "We could not complete the check. Confirm the URL is reachable from the internet.";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Server is not configured." }, { status: 500 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ ok: false, message: "Sign in to run a test." }, { status: 401 });
  }

  let body: { url?: string; monitorKind?: MonitorTestMonitorKind };
  try {
    body = (await request.json()) as { url?: string; monitorKind?: MonitorTestMonitorKind };
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const kind = body.monitorKind ?? "website";
  const target = normalizeHttpUrl(typeof body.url === "string" ? body.url : "", kind);

  if (!target || !/^https?:\/\//i.test(target)) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Enter a full URL (https://…) or a hostname we can turn into one. For TCP/UDP/DNS, use an HTTP health URL for now—we’ll expand probe types soon.",
      },
      { status: 400 },
    );
  }

  const result = await runHttpCheck(target, 12_000);
  const healthy = result.status === "operational" || result.status === "degraded";

  return NextResponse.json({
    ok: healthy,
    urlTested: target,
    status: result.status,
    responseTimeMs: result.responseTimeMs,
    httpStatus: result.httpStatus,
    errorReason: result.errorReason,
    message: healthy
      ? result.status === "degraded"
        ? "Reachable, but response time looks elevated—counts as degraded."
        : "Looking good—this endpoint responds like an operational service."
      : friendlyMessage(result.errorReason, result.httpStatus),
  });
}
