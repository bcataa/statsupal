import type { Incident } from "@/lib/models/monitoring";
import { Resend } from "resend";

type Logger = Pick<Console, "info" | "warn" | "error">;

type NotificationWorkspaceSettings = {
  workspaceName: string;
  incidentAlertsEnabled: boolean;
  incidentEmailAlertsEnabled: boolean;
  maintenanceEmailAlertsEnabled: boolean;
  discordBotToken?: string;
  discordBotChannelId?: string;
  discordWebhookUrl?: string;
  alertEmail?: string;
  supportEmail?: string;
};

type IncidentNotificationEvent = "created" | "resolved";

type IncidentNotificationInput = {
  event: IncidentNotificationEvent;
  service: {
    id: string;
    name: string;
    url: string;
  };
  incident: {
    id: string;
    title: string;
    status: Incident["status"];
    severity: Incident["severity"];
    resolutionSummary?: string;
  };
  workspace: NotificationWorkspaceSettings;
  subscriberEmails?: string[];
  logger?: Logger;
};

type NotificationProvider = {
  name: string;
  canSend: (input: IncidentNotificationInput) => boolean;
  sendIncidentEvent: (input: IncidentNotificationInput) => Promise<void>;
};

type SendIncidentEmailInput = {
  to: string[] | string;
  subject: string;
  title: string;
  description: string;
  status: "DOWN" | "RESOLVED";
  serviceName: string;
  timestamp?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendIncidentEmail({
  to,
  subject,
  title,
  description,
  status,
  serviceName,
  timestamp,
}: SendIncidentEmailInput) {
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error("Missing RESEND_FROM_EMAIL");
  }

  const recipients = Array.isArray(to) ? to : [to];
  if (recipients.length === 0) {
    return;
  }

  const resend = getResendClient();
  const sentAt = timestamp ?? new Date().toISOString();
  const statusTone =
    status === "DOWN"
      ? "background:#fef2f2;color:#991b1b;border:1px solid #fecaca;"
      : "background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;";

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#18181b;">
      <h2 style="margin:0 0 14px;font-size:22px;line-height:1.3;">${escapeHtml(title)}</h2>
      <div style="display:inline-block;padding:6px 10px;border-radius:9999px;font-size:12px;font-weight:600;${statusTone}">
        ${escapeHtml(status)}
      </div>
      <p style="margin:16px 0 8px;font-size:14px;"><strong>Service:</strong> ${escapeHtml(serviceName)}</p>
      <p style="margin:0 0 8px;font-size:14px;"><strong>Description:</strong> ${escapeHtml(description)}</p>
      <p style="margin:0;font-size:12px;color:#52525b;"><strong>Timestamp:</strong> ${escapeHtml(sentAt)}</p>
    </div>
  `;

  await resend.emails.send({
    from: fromEmail,
    to: recipients,
    subject,
    html,
  });
}

function buildDiscordMessage(input: IncidentNotificationInput): string {
  const { event, service, incident, workspace } = input;
  if (event === "created") {
    return [
      `**${workspace.workspaceName}** monitoring alert`,
      `Service **${service.name}** is down.`,
      `Incident: **${incident.title}**`,
      `Severity: **${incident.severity}**`,
      `Status: **${incident.status}**`,
      `URL: ${service.url}`,
    ].join("\n");
  }

  return [
    `**${workspace.workspaceName}** recovery update`,
    `Service **${service.name}** recovered.`,
    `Incident resolved: **${incident.title}**`,
    incident.resolutionSummary ? `Resolution: ${incident.resolutionSummary}` : undefined,
    `URL: ${service.url}`,
  ]
    .filter(Boolean)
    .join("\n");
}

type SendDiscordBotMessageInput = {
  botToken: string;
  channelId: string;
  content: string;
};

export async function sendDiscordBotMessage({
  botToken,
  channelId,
  content,
}: SendDiscordBotMessageInput) {
  const response = await fetch(
    `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    },
  );

  if (!response.ok) {
    throw new Error(`Discord bot message failed with HTTP ${response.status}`);
  }
}

type SendDiscordWebhookMessageInput = {
  webhookUrl: string;
  content: string;
};

export async function sendDiscordWebhookMessage({
  webhookUrl,
  content,
}: SendDiscordWebhookMessageInput) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed with HTTP ${response.status}`);
  }
}

const emailProvider: NotificationProvider = {
  name: "email",
  canSend(input) {
    if (!input.workspace.incidentEmailAlertsEnabled) {
      return false;
    }
    const recipients = new Set<string>();
    if (input.workspace.alertEmail) {
      recipients.add(input.workspace.alertEmail.trim().toLowerCase());
    }
    for (const email of input.subscriberEmails ?? []) {
      recipients.add(email.trim().toLowerCase());
    }
    return (
      recipients.size > 0 &&
      Boolean(process.env.RESEND_API_KEY) &&
      Boolean(process.env.RESEND_FROM_EMAIL)
    );
  },
  async sendIncidentEvent(input) {
    const recipients = new Set<string>();
    if (input.workspace.alertEmail) {
      recipients.add(input.workspace.alertEmail.trim().toLowerCase());
    }
    for (const email of input.subscriberEmails ?? []) {
      recipients.add(email.trim().toLowerCase());
    }
    if (recipients.size === 0) {
      return;
    }

    const subject =
      input.event === "created"
        ? `[${input.workspace.workspaceName}] Incident started: ${input.incident.title}`
        : `[${input.workspace.workspaceName}] Incident resolved: ${input.incident.title}`;
    await sendIncidentEmail({
      to: Array.from(recipients),
      subject,
      title: input.incident.title,
      description:
        input.event === "created"
          ? `An incident has been detected for ${input.service.name}. The team is investigating.`
          : input.incident.resolutionSummary ??
            `The incident affecting ${input.service.name} has been resolved.`,
      status: input.event === "created" ? "DOWN" : "RESOLVED",
      serviceName: input.service.name,
      timestamp: new Date().toISOString(),
    });
  },
};

const providers: NotificationProvider[] = [emailProvider];

export async function notifyIncidentEvent(input: IncidentNotificationInput) {
  const logger = input.logger ?? console;
  if (!input.workspace.incidentAlertsEnabled) {
    logger.info("[monitor-notify] incident alerts disabled", {
      event: input.event,
      incidentId: input.incident.id,
    });
    return;
  }

  const discordMessage = buildDiscordMessage(input);
  const discordBotToken =
    input.workspace.discordBotToken?.trim() || process.env.DISCORD_BOT_TOKEN?.trim();
  const discordBotChannelId = input.workspace.discordBotChannelId?.trim();
  const discordWebhookUrl = input.workspace.discordWebhookUrl?.trim();

  let botAttempted = false;
  let botSent = false;
  if (discordBotChannelId && !discordBotToken) {
    logger.info("[notifications] discord bot token missing, fallback will be used if configured", {
      event: input.event,
      incidentId: input.incident.id,
    });
  }
  if (discordBotToken && discordBotChannelId) {
    botAttempted = true;
    try {
      await sendDiscordBotMessage({
        botToken: discordBotToken,
        channelId: discordBotChannelId,
        content: discordMessage,
      });
      botSent = true;
      logger.info("[notifications] discord bot message sent", {
        event: input.event,
        incidentId: input.incident.id,
      });
    } catch (error) {
      logger.error("[notifications] discord bot message failed", {
        event: input.event,
        incidentId: input.incident.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (discordWebhookUrl && !botSent) {
    try {
      await sendDiscordWebhookMessage({
        webhookUrl: discordWebhookUrl,
        content: discordMessage,
      });
      logger.info("[notifications] discord webhook sent", {
        event: input.event,
        incidentId: input.incident.id,
        fallbackUsed: botAttempted,
      });
      if (botAttempted) {
        logger.info("[notifications] fallback used", {
          provider: "discord_webhook",
          event: input.event,
          incidentId: input.incident.id,
        });
      }
    } catch (error) {
      logger.error("[notifications] discord webhook failed", {
        event: input.event,
        incidentId: input.incident.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const provider of providers) {
    if (!provider.canSend(input)) {
      continue;
    }
    try {
      await provider.sendIncidentEvent(input);
          logger.info(
            provider.name === "email"
              ? "[notifications] email sent"
              : "[monitor-notify] sent incident notification",
            {
        provider: provider.name,
        event: input.event,
        incidentId: input.incident.id,
            },
          );
    } catch (error) {
          logger.error(
            provider.name === "email"
              ? "[notifications] email failed"
              : "[monitor-notify] notification failed",
            {
              provider: provider.name,
              event: input.event,
              incidentId: input.incident.id,
              error: error instanceof Error ? error.message : String(error),
            },
          );
    }
  }
}
