export type AutomationTriggerType = "service_down" | "incident_created" | "incident_resolved";

export type AutomationWebhookBody = {
  event: string;
  workspaceId: string;
  serviceId: string;
  serviceName: string;
  status: string;
  timestamp: string;
  incidentId?: string;
};
