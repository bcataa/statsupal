import { NextResponse } from "next/server";
import type { AutomationTriggerType } from "@/lib/automations/types";
import { isAllowedWebhookUrl } from "@/lib/automations/validate-webhook-url";
import { ensureWorkspace } from "@/lib/supabase/app-data";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRIGGERS = new Set<AutomationTriggerType>([
  "service_down",
  "incident_created",
  "incident_resolved",
]);

type PatchBody = {
  name?: string;
  trigger_type?: string;
  webhook_url?: string;
  secret?: string | null;
  clear_secret?: boolean;
  cooldown_minutes?: number;
  enabled?: boolean;
  retry_enabled?: boolean;
};

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
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

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON." }, { status: 400 });
  }

  try {
    const workspace = await ensureWorkspace(supabase, user.id);
    const existing = await supabase
      .from("automation_rules")
      .select("id,secret")
      .eq("id", ruleId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (existing.error || !existing.data) {
      return NextResponse.json({ success: false, message: "Rule not found." }, { status: 404 });
    }

    const row = existing.data as { id: string; secret: string | null };
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name != null) {
      const n = body.name.trim();
      if (!n || n.length > 120) {
        return NextResponse.json({ success: false, message: "Invalid name." }, { status: 400 });
      }
      updates.name = n;
    }

    if (body.trigger_type != null) {
      const t = body.trigger_type.trim() as AutomationTriggerType;
      if (!TRIGGERS.has(t)) {
        return NextResponse.json({ success: false, message: "Invalid trigger_type." }, { status: 400 });
      }
      updates.trigger_type = t;
    }

    if (body.webhook_url != null) {
      const urlCheck = isAllowedWebhookUrl(body.webhook_url);
      if (!urlCheck.ok) {
        return NextResponse.json({ success: false, message: urlCheck.message }, { status: 400 });
      }
      updates.webhook_url = urlCheck.url;
    }

    if (body.clear_secret === true) {
      updates.secret = null;
    } else if (typeof body.secret === "string" && body.secret.trim().length > 0) {
      updates.secret = body.secret.trim();
    }

    if (body.cooldown_minutes != null) {
      updates.cooldown_minutes = Math.min(1440, Math.max(1, Math.floor(Number(body.cooldown_minutes))));
    }
    if (body.enabled != null) {
      updates.enabled = Boolean(body.enabled);
    }
    if (body.retry_enabled != null) {
      updates.retry_enabled = Boolean(body.retry_enabled);
    }

    const upd = await supabase.from("automation_rules").update(updates).eq("id", ruleId).eq("user_id", user.id);

    if (upd.error) {
      return NextResponse.json({ success: false, message: "Could not update rule." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Could not update rule." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
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
    const del = await supabase
      .from("automation_rules")
      .delete()
      .eq("id", ruleId)
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id);

    if (del.error) {
      return NextResponse.json({ success: false, message: "Could not delete rule." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Could not delete rule." }, { status: 500 });
  }
}
