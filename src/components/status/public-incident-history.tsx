import type { Incident, Service } from "@/lib/models/monitoring";
import { formatDateTime } from "@/lib/utils/date-time";
import { StatusBadge } from "@/components/ui/status-badge";

type PublicIncidentHistoryProps = {
  incidents: Incident[];
  services: Service[];
};

export function PublicIncidentHistory({
  incidents,
  services,
}: PublicIncidentHistoryProps) {
  const serviceNameById = new Map(services.map((service) => [service.id, service.name]));
  const activeIncidents = incidents
    .filter((incident) => incident.status !== "resolved")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const resolvedIncidents = incidents
    .filter((incident) => incident.status === "resolved")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900">Incident History</h2>
        <p className="text-sm text-zinc-500">Recent incident updates and ongoing investigations.</p>
      </div>

      {incidents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center">
          <p className="text-sm font-medium text-zinc-700">No incidents reported</p>
          <p className="mt-1 text-xs text-zinc-500">
            There are currently no public incidents for this project.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {activeIncidents.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              We are currently working on {activeIncidents.length} active incident
              {activeIncidents.length === 1 ? "" : "s"}.
            </div>
          )}

          {activeIncidents.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Active
              </p>
              {activeIncidents.map((incident) => (
                <article
                  key={incident.id}
                  className="rounded-xl border border-zinc-200 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-zinc-900">{incident.title}</p>
                      <p className="mt-1 text-sm text-zinc-600">
                        Affected service:{" "}
                        {serviceNameById.get(incident.affectedServiceId) ?? "Unknown service"}
                      </p>
                      {incident.description && (
                        <p className="mt-2 text-sm text-zinc-600">{incident.description}</p>
                      )}
                      <p className="mt-2 text-xs text-zinc-500">
                        Started: {formatDateTime(incident.startedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge value={incident.status} />
                      <StatusBadge value={incident.severity} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {resolvedIncidents.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Resolved
              </p>
              {resolvedIncidents.map((incident) => (
                <article
                  key={incident.id}
                  className="rounded-xl border border-zinc-200/80 bg-zinc-50 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-zinc-800">{incident.title}</p>
                      <p className="mt-1 text-sm text-zinc-600">
                        Affected service:{" "}
                        {serviceNameById.get(incident.affectedServiceId) ?? "Unknown service"}
                      </p>
                      {incident.resolutionSummary && (
                        <p className="mt-2 text-sm text-zinc-600">
                          Resolution: {incident.resolutionSummary}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-zinc-500">
                        Resolved:{" "}
                        {incident.resolvedAt
                          ? formatDateTime(incident.resolvedAt)
                          : formatDateTime(incident.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge value={incident.status} />
                      <StatusBadge value={incident.severity} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
