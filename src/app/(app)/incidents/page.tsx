"use client";

import { CreateIncidentButton } from "@/components/incidents/create-incident-button";
import { IncidentsList } from "@/components/incidents/incidents-list";
import { useAppData } from "@/state/app-data-provider";

export default function IncidentsPage() {
  const { incidents, services, updateIncidentStatus, resolveIncident } = useAppData();

  const activeIncidents = incidents
    .filter((incident) => incident.status !== "resolved")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const resolvedIncidents = incidents
    .filter((incident) => incident.status === "resolved")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const monitoringIncidents = incidents.filter(
    (incident) => incident.source === "monitoring",
  ).length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Incidents</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Create, track, and resolve incidents across your monitored services.
            </p>
          </div>
          <CreateIncidentButton />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Active incidents
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{activeIncidents.length}</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Resolved incidents
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{resolvedIncidents.length}</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Monitoring-generated
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{monitoringIncidents}</p>
        </article>
      </section>

      {incidents.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900">No incidents yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            Create your first incident to communicate real-time service disruption updates.
          </p>
          <div className="mt-6 flex justify-center">
            <CreateIncidentButton />
          </div>
        </section>
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                Active Incidents
              </h3>
              <p className="text-sm text-zinc-500">{activeIncidents.length} active</p>
            </div>
            <IncidentsList
              incidents={activeIncidents}
              services={services}
              onUpdateStatus={updateIncidentStatus}
              onResolve={resolveIncident}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                Resolved Incidents
              </h3>
              <p className="text-sm text-zinc-500">{resolvedIncidents.length} resolved</p>
            </div>
            <IncidentsList
              incidents={resolvedIncidents}
              services={services}
              onUpdateStatus={updateIncidentStatus}
              onResolve={resolveIncident}
            />
          </section>
        </div>
      )}
    </div>
  );
}
