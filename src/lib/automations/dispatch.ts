import type { AutomationTriggerType, AutomationWebhookBody } from "@/lib/automations/types";
import { deliverAutomationWebhook } from "@/lib/automations/deliver";
import { logAutomations } from "@/lib/logging/server-log";
import { createAdminClient } from "@/lib/supabase/admin";

export type DispatchAutomationParams = {
  trigger: AutomationTriggerType;
  workspaceId: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  /** Operational status string for the payload (e.g. down, investigating, resolved). */
  status: string;
  incidentId?: string | null;
};

type RuleRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  trigger_type: string;
  webhook_url: string;
  secret: string | null;
  cooldown_minutes: number;
  enabled: boolean;
  retry_enabled: boolean;
  last_triggered_at: string | null;
};

function buildWebhookBody(params: DispatchAutomationParams): AutomationWebhookBody {
  const timestamp = new Date().toISOString();
  const base: AutomationWebhookBody = {
    event: params.trigger,
    workspaceId: params.workspaceId,
    serviceId: params.serviceId,
    serviceName: params.serviceName,
    status: params.status,
    timestamp,
  };
  if (params.incidentId) {
    base.incidentId = params.incidentId;
  }
  return base;
}

function isInCooldown(rule: RuleRow, nowMs: number): boolean {
  if (!rule.last_triggered_at) {
    return false;
  }
  const last = new Date(rule.last_triggered_at).getTime();
  const windowMs = Math.max(0, (rule.cooldown_minutes ?? 5) * 60_000);
  return nowMs - last < windowMs;
}

/**
 * Loads matching automation rules and delivers webhooks (service role). Never runs shell commands.
 */
export async function dispatchAutomationWebhooks(params: DispatchAutomationParams): Promise<void> {
  // Service role: bypasses RLS for reads/writes to automation tables.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const rulesRes = await admin
    .from("automation_rules")
    .select(
      "id,workspace_id,user_id,trigger_type,webhook_url,secret,cooldown_minutes,enabled,retry_enabled,last_triggered_at",
    )
    .eq("workspace_id", params.workspaceId)
    .eq("trigger_type", params.trigger)
    .eq("enabled", true);

  if (rulesRes.error) {
    if ((rulesRes.error as { code?: string }).code === "42P01") {
      logAutomations.warn("automation_rules table missing; skip dispatch");
      return;
    }
    logAutomations.error("failed to load automation rules", {
      message: String((rulesRes.error as { message?: string }).message ?? rulesRes.error),
    });
    return;
  }

  const ruleRows = (rulesRes.data ?? []) as RuleRow[];
  if (ruleRows.length === 0) {
    return;
  }

  const bodyObj = buildWebhookBody(params);
  const rawBody = JSON.stringify(bodyObj);

  for (const rule of ruleRows) {
    if (rule.user_id !== params.userId) {
      continue;
    }
    const nowMs = Date.now();
    if (isInCooldown(rule, nowMs)) {
      logAutomations.info("automation skipped (cooldown)", { ruleId: rule.id, trigger: params.trigger });
      continue;
    }

    const attempts = await deliverAutomationWebhook({
      webhookUrl: rule.webhook_url,
      rawBody,
      secret: rule.secret,
      retryEnabled: rule.retry_enabled !== false,
    });

    const final = attempts[attempts.length - 1];
    const success = Boolean(final?.success);
    const completedAt = new Date().toISOString();

    for (const a of attempts) {
      const logId = `awl_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
      const ins = await admin.from("automation_webhook_logs").insert({
        id: logId,
        rule_id: rule.id,
        workspace_id: params.workspaceId,
        event_type: params.trigger,
        attempt_number: a.attempt,
        success: a.success,
        http_status: a.httpStatus,
        error_message: a.errorMessage,
        created_at: completedAt,
      });
      if (ins.error) {
        logAutomations.warn("could not write automation_webhook_logs row");
      }
    }

    await admin
      .from("automation_rules")
      .update({
        last_triggered_at: completedAt,
        last_delivery_status: success ? "success" : "failed",
        last_http_status: final?.httpStatus ?? null,
        last_error: success ? null : (final?.errorMessage ?? "failed").slice(0, 500),
        updated_at: completedAt,
      })
      .eq("id", rule.id);

    logAutomations.info("automation dispatch finished", {
      ruleId: rule.id,
      trigger: params.trigger,
      success,
    });
  }
}
