import type { Incident } from "@/lib/models/monitoring";

type Logger = Pick<Console, "info" | "warn" | "error">;

type NotificationWorkspaceSettings = {
  workspaceName: string;
  incidentAlertsEnabled: boolean;
  incidentEmailAlertsEnabled: boolean;
  maintenanceEmailAlertsEnabled: boolean;
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

const discordProvider: NotificationProvider = {
  name: "discord",
  canSend(input) {
    return Boolean(input.workspace.discordWebhookUrl?.trim());
  },
  async sendIncidentEvent(input) {
    const logger = input.logger ?? console;
    const webhook = input.workspace.discordWebhookUrl?.trim();
    if (!webhook) {
      logger.info("[monitor-notify] discord webhook not configured", {
        event: input.event,
        incidentId: input.incident.id,
      });
      return;
    }

    const response = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: buildDiscordMessage(input),
      }),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed with HTTP ${response.status}`);
    }
  },
};

const emailProvider: NotificationProvider = {
  name: "email",
  canSend(input) {
    const recipients = new Set<string>();
    if (input.workspace.alertEmail) {
      recipients.add(input.workspace.alertEmail.trim().toLowerCase());
    }
    for (const email of input.subscriberEmails ?? []) {
      recipients.add(email.trim().toLowerCase());
    }
    return recipients.size > 0 && Boolean(process.env.RESEND_API_KEY);
  },
  async sendIncidentEvent(input) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return;
    }
    if (!input.workspace.incidentEmailAlertsEnabled) {
      return;
    }

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

    const from =
      process.env.RESEND_FROM_EMAIL ||
      input.workspace.supportEmail ||
      "alerts@statsupal.local";
    const subject =
      input.event === "created"
        ? `[${input.workspace.workspaceName}] Incident started: ${input.incident.title}`
        : `[${input.workspace.workspaceName}] Incident resolved: ${input.incident.title}`;
    const html = `
      <h2>${input.workspace.workspaceName} status update</h2>
      <p><strong>Service:</strong> ${input.service.name}</p>
      <p><strong>Incident:</strong> ${input.incident.title}</p>
      <p><strong>Status:</strong> ${input.incident.status}</p>
      <p><strong>Severity:</strong> ${input.incident.severity}</p>
      ${input.incident.resolutionSummary ? `<p><strong>Resolution:</strong> ${input.incident.resolutionSummary}</p>` : ""}
      <p><strong>URL:</strong> ${input.service.url}</p>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.from(recipients),
        subject,
        html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Email provider failed with HTTP ${response.status}`);
    }
  },
};

const providers: NotificationProvider[] = [discordProvider, emailProvider];

export async function notifyIncidentEvent(input: IncidentNotificationInput) {
  const logger = input.logger ?? console;
  if (!input.workspace.incidentAlertsEnabled) {
    logger.info("[monitor-notify] incident alerts disabled", {
      event: input.event,
      incidentId: input.incident.id,
    });
    return;
  }

  for (const provider of providers) {
    if (!provider.canSend(input)) {
      continue;
    }
    try {
      await provider.sendIncidentEvent(input);
      logger.info("[monitor-notify] sent incident notification", {
        provider: provider.name,
        event: input.event,
        incidentId: input.incident.id,
      });
    } catch (error) {
      logger.error("[monitor-notify] notification failed", {
        provider: provider.name,
        event: input.event,
        incidentId: input.incident.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
