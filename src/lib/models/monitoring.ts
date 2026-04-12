export type ServiceStatus = "pending" | "operational" | "degraded" | "down";
export type CheckType = "http" | "ping" | "api";

export type Service = {
  id: string;
  name: string;
  url: string;
  isPublished: boolean;
  timeoutMs: number;
  failureThreshold: number;
  retryCount: number;
  status: ServiceStatus;
  checkType: CheckType;
  checkInterval: string;
  lastChecked: string;
  responseTimeMs: number;
  description?: string;
  createdAt: string;
};

export type IncidentStatus =
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved";
export type IncidentSeverity = "minor" | "major" | "critical";

export type Incident = {
  id: string;
  title: string;
  description?: string;
  source?: "manual" | "monitoring";
  affectedServiceId: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  startedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionSummary?: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "success" | "warning" | "danger";
};

export type UptimeDayPoint = {
  day: string;
  /** Null when there were no checks on that local calendar day. */
  uptimePercentage: number | null;
};

export type UptimeSummary = {
  points: UptimeDayPoint[];
  averageUptimePercentage: number;
  averageResponseTimeMs: number;
  /** True when percentages are derived from service_check_history (not the synthetic fallback). */
  hasCheckHistory: boolean;
};

export type MaintenanceWindowStatus = "scheduled" | "active" | "completed" | "cancelled";

export type MaintenanceWindow = {
  id: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  affectedServiceIds: string[];
  status: MaintenanceWindowStatus;
  createdAt: string;
};

export type IncidentEventType =
  | "created"
  | "status_changed"
  | "monitoring"
  | "resolved"
  | "manual_update"
  | "maintenance_linked";

export type IncidentEvent = {
  id: string;
  incidentId: string;
  eventType: IncidentEventType;
  message: string;
  source: "monitoring" | "manual" | "system";
  createdAt: string;
};

export type AlertSubscriber = {
  id: string;
  email: string;
  incidentCreated: boolean;
  incidentResolved: boolean;
  maintenanceAlerts: boolean;
  token: string;
  active: boolean;
  createdAt: string;
};
