import type { Incident, Service } from "@/lib/models/monitoring";
import { formatDateTime } from "@/lib/utils/date-time";
import { StatusBadge } from "@/components/ui/status-badge";

type RecentIncidentsSectionProps = {
  incidents: Incident[];
  services: Service[];
};

export function RecentIncidentsSection({
  incidents,
  services,
}: RecentIncidentsSectionProps) {
  const serviceNameById = new Map(services.map((service) => [service.id, service.name]));
  const recent = [...incidents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-900">Recent Incidents</h2>
        <p className="text-sm text-zinc-500">Latest issues and their current progress.</p>
      </div>

      <div className="space-y-3">
        {recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center text-sm text-zinc-600">
            No incidents reported.
          </div>
        ) : (
          recent.map((incident) => (
            <article key={incident.id} className="rounded-xl border border-zinc-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-900">{incident.title}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Service: {serviceNameById.get(incident.affectedServiceId) ?? "Unknown service"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={incident.status} />
                  <StatusBadge value={incident.severity} />
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Started: {formatDateTime(incident.startedAt)}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
