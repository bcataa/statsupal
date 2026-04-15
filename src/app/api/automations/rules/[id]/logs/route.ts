import { NextResponse } from "next/server";
import { ensureWorkspace } from "@/lib/supabase/app-data";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
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

  const limit = Math.min(100, Math.max(1, Number(new URL(request.url).searchParams.get("limit")) || 30));

  try {
    const workspace = await ensureWorkspace(supabase, user.id);
    const own = await supabase
      .from("automation_rules")
      .select("id")
      .eq("id", ruleId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (own.error || !own.data) {
      return NextResponse.json({ success: false, message: "Rule not found." }, { status: 404 });
    }

    const logs = await supabase
      .from("automation_webhook_logs")
      .select("id,event_type,attempt_number,success,http_status,error_message,created_at")
      .eq("rule_id", ruleId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (logs.error) {
      return NextResponse.json({ success: false, message: "Could not load logs." }, { status: 500 });
    }

    return NextResponse.json({ success: true, logs: logs.data ?? [] });
  } catch {
    return NextResponse.json({ success: false, message: "Could not load logs." }, { status: 500 });
  }
}
