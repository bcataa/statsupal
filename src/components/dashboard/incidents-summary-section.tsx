import type { Incident, Service } from "@/lib/models/monitoring";
import { formatDateTime } from "@/lib/utils/date-time";
import { StatusBadge } from "@/components/ui/status-badge";

type IncidentsSummarySectionProps = {
  incidents: Incident[];
  services: Service[];
};

export function IncidentsSummarySection({
  incidents,
  services,
}: IncidentsSummarySectionProps) {
  const serviceNameById = new Map(services.map((service) => [service.id, service.name]));
  const activeIncidents = incidents.filter((incident) => incident.status !== "resolved");
  const recentIncidents = [...incidents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-900">Incident Summary</h2>
        <p className="text-sm text-zinc-500">
          Active and recent incident updates across this project.
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Active incidents
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{activeIncidents.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Total incidents
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{incidents.length}</p>
        </div>
      </div>

      {activeIncidents.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {activeIncidents.length} active incident
          {activeIncidents.length === 1 ? "" : "s"} currently affect service reliability.
        </div>
      )}

      <div className="space-y-3">
        {recentIncidents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center text-sm text-zinc-600">
            No incidents reported yet.
          </div>
        ) : (
          recentIncidents.map((incident) => (
            <article key={incident.id} className="rounded-xl border border-zinc-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-900">{incident.title}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Service: {serviceNameById.get(incident.affectedServiceId) ?? "Unknown service"}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
                    Source: {incident.source ?? "manual"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={incident.status} />
                  <StatusBadge value={incident.severity} />
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Updated: {formatDateTime(incident.updatedAt)}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
