import type { Incident } from "@/lib/models/monitoring";

type Logger = Pick<Console, "info" | "warn" | "error">;

type NotificationWorkspaceSettings = {
  workspaceName: string;
  incidentAlertsEnabled: boolean;
  discordWebhookUrl?: string;
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
  logger?: Logger;
};

type NotificationProvider = {
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

const providers: NotificationProvider[] = [discordProvider];

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
    try {
      await provider.sendIncidentEvent(input);
      logger.info("[monitor-notify] sent incident notification", {
        provider: "discord",
        event: input.event,
        incidentId: input.incident.id,
      });
    } catch (error) {
      logger.error("[monitor-notify] notification failed", {
        provider: "discord",
        event: input.event,
        incidentId: input.incident.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
