"use client";

import type { Incident } from "@/lib/models/monitoring";
import { formatDateTime } from "@/lib/utils/date-time";
import { StatusBadge } from "@/components/ui/status-badge";

type PublicIncidentHistoryProps = {
  incidents: Incident[];
  /** Id + name only; used to label affected services. */
  services: { id: string; name: string }[];
  tone?: "light" | "dark";
};

export function PublicIncidentHistory({
  incidents,
  services,
  tone = "light",
}: PublicIncidentHistoryProps) {
  const isDark = tone === "dark";
  const serviceNameById = new Map(services.map((service) => [service.id, service.name]));
  const activeIncidents = incidents
    .filter((incident) => incident.status !== "resolved")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const resolvedIncidents = incidents
    .filter((incident) => incident.status === "resolved")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <section
      className={
        isDark
          ? "rounded-2xl border border-white/10 bg-[#0a0a0a] p-4 sm:p-6"
          : "rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6"
      }
    >
      <div className="mb-4">
        <h2
          className={
            isDark
              ? "text-lg font-semibold text-white sm:text-xl"
              : "text-lg font-semibold text-zinc-900 sm:text-xl"
          }
        >
          Recent notices
        </h2>
        <p
          className={
            isDark ? "mt-1 text-xs text-zinc-500 sm:text-sm" : "mt-1 text-xs text-zinc-500 sm:text-sm"
          }
        >
          Recent and resolved incidents. Times are shown in your local timezone.
        </p>
      </div>

      {incidents.length === 0 ? (
        <div
          className={
            isDark
              ? "rounded-xl border border-dashed border-white/15 bg-zinc-950/80 px-4 py-6 text-center"
              : "rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center"
          }
        >
          <p className={isDark ? "text-sm font-medium text-zinc-300" : "text-sm font-medium text-zinc-700"}>
            No incidents reported
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            There are currently no public incidents for this project.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {activeIncidents.length > 0 && (
            <div
              className={
                isDark
                  ? "rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                  : "rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              }
            >
              We are currently working on {activeIncidents.length} active incident
              {activeIncidents.length === 1 ? "" : "s"}.
            </div>
          )}

          {activeIncidents.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Active</p>
              {activeIncidents.map((incident) => (
                <article
                  key={incident.id}
                  className={
                    isDark
                      ? "rounded-xl border border-white/10 bg-zinc-950/50 px-3 py-4 sm:px-4"
                      : "rounded-xl border border-zinc-200 px-3 py-4 sm:px-4"
                  }
                >
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p
                        className={
                          isDark
                            ? "break-words font-medium text-zinc-100"
                            : "break-words font-medium text-zinc-900"
                        }
                      >
                        {incident.title}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        Affected service:{" "}
                        {serviceNameById.get(incident.affectedServiceId) ?? "Unknown service"}
                      </p>
                      {incident.description && (
                        <p className="mt-2 text-sm text-zinc-500">{incident.description}</p>
                      )}
                      <p className="mt-2 text-xs text-zinc-600">
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
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Resolved</p>
              {resolvedIncidents.map((incident) => (
                <article
                  key={incident.id}
                  className={
                    isDark
                      ? "rounded-xl border border-white/10 bg-zinc-900/40 px-3 py-4 sm:px-4"
                      : "rounded-xl border border-zinc-200/80 bg-zinc-50 px-3 py-4 sm:px-4"
                  }
                >
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p
                        className={
                          isDark
                            ? "break-words font-medium text-zinc-200"
                            : "break-words font-medium text-zinc-800"
                        }
                      >
                        {incident.title}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        Affected service:{" "}
                        {serviceNameById.get(incident.affectedServiceId) ?? "Unknown service"}
                      </p>
                      {incident.resolutionSummary && (
                        <p className="mt-2 text-sm text-zinc-500">
                          Resolution: {incident.resolutionSummary}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-zinc-600">
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
