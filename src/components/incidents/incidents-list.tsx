import type { Incident, IncidentStatus, Service } from "@/lib/models/monitoring";
import { IncidentCard } from "@/components/incidents/incident-card";

type IncidentsListProps = {
  incidents: Incident[];
  services: Service[];
  onUpdateStatus: (incidentId: string, status: IncidentStatus) => void;
  onResolve: (incidentId: string, resolutionSummary?: string) => void;
};

export function IncidentsList({
  incidents,
  services,
  onUpdateStatus,
  onResolve,
}: IncidentsListProps) {
  const serviceNameById = new Map(services.map((service) => [service.id, service.name]));

  if (incidents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-zinc-800">No incidents in this section</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {incidents.map((incident) => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          serviceName={serviceNameById.get(incident.affectedServiceId) ?? "Unknown service"}
          onUpdateStatus={onUpdateStatus}
          onResolve={onResolve}
        />
      ))}
    </div>
  );
}
