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

export async function GET() {
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
      .select(
        "id,name,trigger_type,webhook_url,secret,cooldown_minutes,enabled,retry_enabled,last_triggered_at,last_delivery_status,last_http_status,last_error,created_at",
      )
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });

    if (res.error) {
      if ((res.error as { code?: string }).code === "42P01") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Automations are not set up yet. Run supabase/migrations/20260409120000_automation_rules.sql in your project.",
          },
          { status: 500 },
        );
      }
      return NextResponse.json({ success: false, message: "Could not load automations." }, { status: 500 });
    }

    const rows = (res.data ?? []) as Record<string, unknown>[];
    const safe = rows.map((r) => ({
      ...r,
      secret: r.secret ? "••••••••" : null,
      hasSecret: Boolean(r.secret),
    }));

    return NextResponse.json({ success: true, rules: safe });
  } catch {
    return NextResponse.json({ success: false, message: "Could not load workspace." }, { status: 500 });
  }
}

type PostBody = {
  name?: string;
  trigger_type?: string;
  webhook_url?: string;
  secret?: string | null;
  cooldown_minutes?: number;
  enabled?: boolean;
  retry_enabled?: boolean;
};

export async function POST(request: Request) {
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

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON." }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name || name.length > 120) {
    return NextResponse.json({ success: false, message: "Name is required (max 120 characters)." }, { status: 400 });
  }

  const trigger = body.trigger_type?.trim() as AutomationTriggerType | undefined;
  if (!trigger || !TRIGGERS.has(trigger)) {
    return NextResponse.json(
      { success: false, message: "trigger_type must be service_down, incident_created, or incident_resolved." },
      { status: 400 },
    );
  }

  const urlCheck = isAllowedWebhookUrl(body.webhook_url ?? "");
  if (!urlCheck.ok) {
    return NextResponse.json({ success: false, message: urlCheck.message }, { status: 400 });
  }

  const cooldown = Math.min(1440, Math.max(1, Math.floor(Number(body.cooldown_minutes) || 5)));
  const secret =
    typeof body.secret === "string" && body.secret.trim().length > 0 ? body.secret.trim() : null;

  try {
    const workspace = await ensureWorkspace(supabase, user.id);
    const id = `ar_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
    const now = new Date().toISOString();

    const insert = await supabase.from("automation_rules").insert({
      id,
      workspace_id: workspace.id,
      user_id: user.id,
      name,
      trigger_type: trigger,
      webhook_url: urlCheck.url,
      secret,
      cooldown_minutes: cooldown,
      enabled: body.enabled !== false,
      retry_enabled: body.retry_enabled !== false,
      created_at: now,
      updated_at: now,
    });

    if (insert.error) {
      if ((insert.error as { code?: string }).code === "42P01") {
        return NextResponse.json(
          { success: false, message: "automation_rules table missing. Apply latest migration." },
          { status: 500 },
        );
      }
      return NextResponse.json({ success: false, message: "Could not create rule." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rule: {
        id,
        name,
        trigger_type: trigger,
        webhook_url: urlCheck.url,
        hasSecret: Boolean(secret),
        secret: secret ? "••••••••" : null,
        cooldown_minutes: cooldown,
        enabled: body.enabled !== false,
        retry_enabled: body.retry_enabled !== false,
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: "Could not create rule." }, { status: 500 });
  }
}
