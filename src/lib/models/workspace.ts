export type Project = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type WorkspaceNotificationSettings = {
  incidentAlertsEnabled: boolean;
  maintenanceAlertsEnabled: boolean;
  incidentEmailAlertsEnabled: boolean;
  maintenanceEmailAlertsEnabled: boolean;
  discordWebhookUrl?: string;
  alertEmail?: string;
  supportEmail?: string;
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

/** Visual style for the public status page. */
export type StatusPageStyle = "standard" | "premium_dark";

export type WorkspaceStatusPageDesign = {
  style: StatusPageStyle;
  /** Primary brand / header accent (hex). */
  brandColor?: string;
  /** Healthy / operational accents (hex). */
  operationalColor?: string;
  logoUrl?: string;
  /** Optional logo for dark headers (public + preview). */
  logoDarkUrl?: string;
  faviconUrl?: string;
  /** Degraded / partial / major / maintenance / pending accents (see `status-page-theme.ts`). */
  degradedColor?: string;
  partialOutageColor?: string;
  majorOutageColor?: string;
  maintenanceColor?: string;
  notStartedColor?: string;
};

export type WorkspaceStatusPageSettings = {
  /** 0 = not started, 1–5 = wizard step, 6 = completed. */
  onboardingWizardStep: number;
  /** When false, the public URL shows an unpublished message. */
  published: boolean;
  design: WorkspaceStatusPageDesign;
};

export type Workspace = {
  id: string;
  name: string;
  projects: Project[];
  publicDescription?: string;
  notificationSettings: WorkspaceNotificationSettings;
  domainSettings: WorkspaceDomainSettings;
  statusPage: WorkspaceStatusPageSettings;
};
