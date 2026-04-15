import { NextResponse } from "next/server";
import { deliverAutomationWebhook } from "@/lib/automations/deliver";
import { ensureWorkspace } from "@/lib/supabase/app-data";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: ruleId } = await ctx.params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ success: false, message: "Supabase is not configured." }, { status: 500 });
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const workspace = await ensureWorkspace(supabase, user.id);
    const res = await supabase
      .from("automation_rules")
      .select("webhook_url,secret,retry_enabled")
      .eq("id", ruleId)
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (res.error || !res.data) {
      return NextResponse.json({ success: false, message: "Rule not found." }, { status: 404 });
    }

    const row = res.data as { webhook_url: string; secret: string | null; retry_enabled: boolean };
    const rawBody = JSON.stringify({
      event: "test",
      workspaceId: workspace.id,
      serviceId: "test",
      serviceName: "Statsupal test ping",
      status: "test",
      timestamp: new Date().toISOString(),
    });

    const attempts = await deliverAutomationWebhook({
      webhookUrl: row.webhook_url,
      rawBody,
      secret: row.secret,
      retryEnabled: row.retry_enabled !== false,
    });

    const ok = attempts.some((a) => a.success);
    return NextResponse.json({
      success: ok,
      message: ok ? "Test webhook delivered." : "Test webhook failed. Check URL and server logs.",
      attempts,
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: e instanceof Error ? e.message : "Test failed.",
      },
      { status: 500 },
    );
  }
}
