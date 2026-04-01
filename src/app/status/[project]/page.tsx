"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import type { Incident, Service } from "@/lib/models/monitoring";
import { formatDateTime, formatTimestampOrText } from "@/lib/utils/date-time";
import { formatServiceResponse } from "@/lib/utils/monitoring-display";
import { useAppData } from "@/state/app-data-provider";

type StatusPageProps = {
  params: { project: string };
};

type OverallStatus = "all-operational" | "partial-outage" | "major-outage";

function formatProjectName(project: string): string {
  const decoded = decodeURIComponent(project || "demo").trim();
  if (!decoded) {
    return "Statsupal";
  }

  return decoded
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getOverallStatus(services: Service[]): OverallStatus {
  if (services.some((service) => service.status === "down")) {
    return "major-outage";
  }
  if (services.some((service) => service.status === "degraded")) {
    return "partial-outage";
  }
  return "all-operational";
}

function getStatusHeadline(status: OverallStatus): string {
  if (status === "major-outage") {
    return "Major Outage";
  }
  if (status === "partial-outage") {
    return "Partial Outage";
  }
  return "All Systems Operational";
}

function getStatusDescription(status: OverallStatus): string {
  if (status === "major-outage") {
    return "Some services are currently having issues. Our team is actively working to restore full service.";
  }
  if (status === "partial-outage") {
    return "A few services are slower than usual or intermittently unavailable. We are monitoring closely.";
  }
  return "Everything is currently operating normally across all monitored services.";
}

function getStatusTone(status: OverallStatus): {
  dotClass: string;
  panelClass: string;
} {
  if (status === "major-outage") {
    return {
      dotClass: "bg-rose-500",
      panelClass: "border-rose-200 bg-rose-50/80 text-rose-900",
    };
  }
  if (status === "partial-outage") {
    return {
      dotClass: "bg-amber-500",
      panelClass: "border-amber-200 bg-amber-50/80 text-amber-900",
    };
  }
  return {
    dotClass: "bg-emerald-500",
    panelClass: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
  };
}

function getLastUpdated(services: Service[], incidents: Incident[]): string {
  const timestamps = [
    ...services.map((service) => service.lastChecked || service.createdAt),
    ...incidents.map((incident) => incident.updatedAt),
  ].filter(Boolean);

  if (timestamps.length === 0) {
    return new Date().toISOString();
  }

  return timestamps.reduce((latest, current) => (current > latest ? current : latest));
}

export default function StatusPage({ params }: StatusPageProps) {
  const { services, incidents, workspace } = useAppData();
  const projectName = formatProjectName(params.project || "demo");
  const overallStatus = getOverallStatus(services);
  const tone = getStatusTone(overallStatus);
  const lastUpdated = getLastUpdated(services, incidents);
  const activeIncidents = incidents.filter((incident) => incident.status !== "resolved");
  const resolvedIncidents = incidents.filter((incident) => incident.status === "resolved");
  const serviceNameById = new Map(services.map((service) => [service.id, service.name]));
  const operationalCount = services.filter((service) => service.status === "operational").length;
  const degradedCount = services.filter((service) => service.status === "degraded").length;
  const downCount = services.filter((service) => service.status === "down").length;

  return (
    <main className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-14">
      <div className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-16 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />

      <div className="relative mx-auto w-full max-w-5xl space-y-8">
        <header className="space-y-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {workspace.name} public status
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 shadow-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${tone.dotClass} animate-pulse`} />
            Live status
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            {getStatusHeadline(overallStatus)}
          </h1>
          <p className="mx-auto max-w-2xl text-base text-zinc-600 sm:text-lg">
            {projectName} status page for customers. {getStatusDescription(overallStatus)}
          </p>
          <p className="text-xs text-zinc-500">Last updated {formatDateTime(lastUpdated)}</p>
        </header>

        <section className={`rounded-2xl border p-6 shadow-sm sm:p-8 ${tone.panelClass}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Current system health
              </h2>
              <p className="mt-1 text-sm/6 opacity-90">
                This page shows live service status and incident updates from our team.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
              <div className="rounded-xl border border-current/20 bg-white/60 px-3 py-2">
                <p className="font-semibold">{operationalCount}</p>
                <p className="opacity-80">Healthy</p>
              </div>
              <div className="rounded-xl border border-current/20 bg-white/60 px-3 py-2">
                <p className="font-semibold">{degradedCount}</p>
                <p className="opacity-80">Slower</p>
              </div>
              <div className="rounded-xl border border-current/20 bg-white/60 px-3 py-2">
                <p className="font-semibold">{downCount}</p>
                <p className="opacity-80">Having issues</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-zinc-900">Services</h2>
            <p className="text-sm text-zinc-500">
              See what is healthy, what is slower than usual, and what is currently impacted.
            </p>
          </div>

          {services.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center">
              <p className="text-sm font-medium text-zinc-700">No services published yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-zinc-900">{service.name}</p>
                      {service.description ? (
                        <p className="mt-1 text-sm text-zinc-600">{service.description}</p>
                      ) : (
                        <p className="mt-1 text-sm text-zinc-500">
                          Core service monitored in real time.
                        </p>
                      )}
                    </div>
                    <StatusBadge value={service.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-600">
                    <p>Last checked: {formatTimestampOrText(service.lastChecked || "Unknown")}</p>
                    <p>
                      Response:{" "}
                      {formatServiceResponse({
                        status: service.status,
                        responseTimeMs: service.responseTimeMs,
                        lastChecked: service.lastChecked,
                      })}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-zinc-900">Incidents</h2>
            <p className="text-sm text-zinc-500">
              When issues happen, updates appear here so you always know what is going on.
            </p>
          </div>

          {incidents.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-8 text-center text-emerald-800">
              <p className="text-base font-semibold">No active incidents</p>
              <p className="mt-1 text-sm">Everything is operating normally.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeIncidents.length > 0 ? (
                activeIncidents.map((incident) => (
                  <article
                    key={incident.id}
                    className="rounded-xl border border-rose-200 bg-rose-50/50 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-zinc-900">{incident.title}</p>
                      <StatusBadge value={incident.status} />
                      <StatusBadge value={incident.severity} />
                    </div>
                    <p className="mt-2 text-sm text-zinc-700">
                      Affected: {serviceNameById.get(incident.affectedServiceId) ?? "Unknown service"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Started {formatDateTime(incident.startedAt)} • Updated {formatDateTime(incident.updatedAt)}
                    </p>
                    {incident.description ? (
                      <p className="mt-2 text-sm text-zinc-700">{incident.description}</p>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-center text-emerald-800">
                  <p className="text-base font-semibold">No active incidents</p>
                  <p className="mt-1 text-sm">Everything is operating normally right now.</p>
                </div>
              )}

              {resolvedIncidents.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Recently resolved
                  </p>
                  {resolvedIncidents.slice(0, 5).map((incident) => (
                    <article
                      key={incident.id}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-800">{incident.title}</p>
                        <StatusBadge value={incident.status} />
                        <StatusBadge value={incident.severity} />
                      </div>
                      <p className="mt-1 text-xs text-zinc-600">
                        Affected: {serviceNameById.get(incident.affectedServiceId) ?? "Unknown service"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        Resolved {formatDateTime(incident.resolvedAt || incident.updatedAt)}
                      </p>
                      {incident.resolutionSummary ? (
                        <p className="mt-2 text-sm text-zinc-700">
                          Resolution: {incident.resolutionSummary}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
          This page provides live service status and incident communication so you can quickly
          understand if everything is working normally. If an issue appears, our team is already
          aware and updates are posted here.
        </section>

        <footer className="pb-4 text-center text-xs text-zinc-500">
          Powered by {workspace.name || "Statsupal"} • Last refresh {formatDateTime(lastUpdated)}
        </footer>
      </div>
    </main>
  );
}
