export type Project = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type WorkspaceNotificationSettings = {
  incidentAlertsEnabled: boolean;
  maintenanceAlertsEnabled: boolean;
  discordWebhookUrl?: string;
};

export type WorkspaceDomainSettings = {
  statusPageSlug: string;
  customDomain?: string;
  customDomainStatus:
    | "unconfigured"
    | "pending_verification"
    | "verified"
    | "failed";
};

export type Workspace = {
  id: string;
  name: string;
  projects: Project[];
  notificationSettings: WorkspaceNotificationSettings;
  domainSettings: WorkspaceDomainSettings;
};
