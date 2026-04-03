import type { Workspace } from "@/lib/models/workspace";

export const defaultWorkspace: Workspace = {
  id: "ws_default",
  name: "StatusPal Workspace",
  projects: [
    {
      id: "proj_main",
      name: "Main Status Page",
      slug: "main-status-page",
      createdAt: "2026-03-24T10:00:00.000Z",
    },
  ],
  notificationSettings: {
    incidentAlertsEnabled: true,
    maintenanceAlertsEnabled: true,
    discordWebhookUrl: undefined,
  },
  domainSettings: {
    statusPageSlug: "main-status-page",
    customDomain: undefined,
    customDomainStatus: "unconfigured",
  },
};
