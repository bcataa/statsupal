export type ServiceStatus = "pending" | "operational" | "degraded" | "down";
export type CheckType = "http" | "ping" | "api";

export type Service = {
  id: string;
  name: string;
  url: string;
  isPublished: boolean;
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
  uptimePercentage: number;
};

export type UptimeSummary = {
  points: UptimeDayPoint[];
  averageUptimePercentage: number;
  averageResponseTimeMs: number;
};
