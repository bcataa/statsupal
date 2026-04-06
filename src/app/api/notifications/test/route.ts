import { NextResponse } from "next/server";
import {
  sendDiscordBotMessage,
  sendDiscordWebhookMessage,
  sendIncidentEmail,
} from "@/lib/monitoring/notifications";
import { ensureWorkspace } from "@/lib/supabase/app-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type WorkspaceRow = {
  id: string;
  name: string;
  incident_email_alerts_enabled: boolean | null;
  discord_webhook_url: string | null;
  alert_email: string | null;
};

type SecretRow = {
  discord_bot_token: string | null;
  discord_bot_channel_id: string | null;
};

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Unknown error";
  }
  const value = error as { message?: unknown };
  return typeof value.message === "string" ? value.message : "Unknown error";
}

function hasErrorCode(error: unknown, code: string): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const value = error as { code?: unknown };
  return value.code === code;
}

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

  let body: { type?: "email" | "discord" } = {};
  try {
    body = (await request.json()) as { type?: "email" | "discord" };
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  if (body.type !== "email" && body.type !== "discord") {
    return NextResponse.json(
      { success: false, message: "type must be either 'email' or 'discord'." },
      { status: 400 },
    );
  }

  try {
    const workspace = await ensureWorkspace(supabase, user.id);
    const admin = createAdminClient() as {
      from: (table: string) => {
        select: (...args: unknown[]) => {
          eq: (...args: unknown[]) => {
            eq: (...args: unknown[]) => {
              maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
            };
            maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
          };
        };
      };
    };

    const workspaceResult = await admin
      .from("workspaces")
      .select("id,name,incident_email_alerts_enabled,discord_webhook_url,alert_email")
      .eq("id", workspace.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (workspaceResult.error || !workspaceResult.data) {
      throw new Error(
        workspaceResult.error
          ? getErrorMessage(workspaceResult.error)
          : "Could not load workspace settings.",
      );
    }
    const workspaceRow = workspaceResult.data as WorkspaceRow;

    const secretResult = await admin
      .from("workspace_notification_secrets")
      .select("discord_bot_token,discord_bot_channel_id")
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id)
      .maybeSingle();
    const secretRow = (secretResult.data ?? null) as SecretRow | null;
    if (secretResult.error && !hasErrorCode(secretResult.error, "42P01")) {
      throw new Error(getErrorMessage(secretResult.error));
    }

    if (body.type === "email") {
      if (!(workspaceRow.incident_email_alerts_enabled ?? false)) {
        return NextResponse.json(
          {
            success: false,
            message: "Enable 'Incident email alerts' first in Notification preferences.",
          },
          { status: 400 },
        );
      }
      const recipient = workspaceRow.alert_email?.trim() || user.email;
      if (!recipient) {
        return NextResponse.json(
          { success: false, message: "Add an alert email before sending a test email." },
          { status: 400 },
        );
      }

      await sendIncidentEmail({
        to: recipient,
        subject: `[${workspaceRow.name}] Test notification`,
        title: "Test incident notification",
        description: "This is a test alert from Statsupal notification settings.",
        status: "DOWN",
        serviceName: "Notification Test Service",
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, message: "Test email sent." });
    }

    const message = `**${workspaceRow.name}** test alert\nThis is a test Discord notification from Statsupal.`;
    const botToken = secretRow?.discord_bot_token?.trim();
    const botChannelId = secretRow?.discord_bot_channel_id?.trim();
    const webhookUrl = workspaceRow.discord_webhook_url?.trim();

    if (botToken && botChannelId) {
      try {
        await sendDiscordBotMessage({
          botToken,
          channelId: botChannelId,
          content: message,
        });
        return NextResponse.json({
          success: true,
          message: "Test Discord alert sent using bot integration.",
        });
      } catch (error) {
        if (webhookUrl) {
          await sendDiscordWebhookMessage({ webhookUrl, content: message });
          return NextResponse.json({
            success: true,
            message: "Bot delivery failed, fallback webhook alert sent.",
          });
        }
        throw error;
      }
    }

    if (webhookUrl) {
      await sendDiscordWebhookMessage({ webhookUrl, content: message });
      return NextResponse.json({
        success: true,
        message: "Test Discord alert sent using webhook fallback.",
      });
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Configure Discord Bot Token + Channel ID or a Discord webhook URL before testing.",
      },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Could not send test notification.",
      },
      { status: 500 },
    );
  }
}
