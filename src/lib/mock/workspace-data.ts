import type { Workspace } from "@/lib/models/workspace";

export const defaultWorkspace: Workspace = {
  id: "ws_default",
  name: "Statsupal Workspace",
  publicDescription: "Real-time system status and incident updates.",
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
    incidentEmailAlertsEnabled: false,
    maintenanceEmailAlertsEnabled: false,
    discordWebhookUrl: undefined,
    alertEmail: undefined,
    supportEmail: undefined,
  },
  domainSettings: {
    statusPageSlug: "main-status-page",
    customDomain: undefined,
    customDomainStatus: "unconfigured",
  },
  statusPage: {
    onboardingWizardStep: 6,
    published: true,
    design: {
      style: "standard",
      brandColor: undefined,
      operationalColor: undefined,
      logoUrl: undefined,
      faviconUrl: undefined,
    },
  },
};
