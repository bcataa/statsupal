import type { Incident, IncidentEvent, IncidentStatus, Service } from "@/lib/models/monitoring";
import { IncidentCard } from "@/components/incidents/incident-card";

type IncidentsListProps = {
  incidents: Incident[];
  incidentEvents: IncidentEvent[];
  services: Service[];
  onUpdateStatus: (incidentId: string, status: IncidentStatus) => void;
  onResolve: (incidentId: string, resolutionSummary?: string) => void;
  onDelete: (incidentId: string) => Promise<void>;
  deletingIncidentId?: string | null;
};

export function IncidentsList({
  incidents,
  incidentEvents,
  services,
  onUpdateStatus,
  onResolve,
  onDelete,
  deletingIncidentId = null,
}: IncidentsListProps) {
  const serviceNameById = new Map(services.map((service) => [service.id, service.name]));

  if (incidents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/30 p-8 text-center">
        <p className="text-sm font-medium text-zinc-400">No incidents in this section</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {incidents.map((incident) => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          timelineEvents={incidentEvents
            .filter((event) => event.incidentId === incident.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
          serviceName={serviceNameById.get(incident.affectedServiceId) ?? "Unknown service"}
          onUpdateStatus={onUpdateStatus}
          onResolve={onResolve}
          onDelete={onDelete}
          isDeleting={deletingIncidentId === incident.id}
        />
      ))}
    </div>
  );
}
