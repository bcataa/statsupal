"use client";

import { useMemo, useState } from "react";
import type { IncidentStatus } from "@/lib/models/monitoring";
import { CreateIncidentButton } from "@/components/incidents/create-incident-button";
import { IncidentsList } from "@/components/incidents/incidents-list";
import { ResolvedIncidentsArchive } from "@/components/incidents/resolved-incidents-archive";
import { useAppData } from "@/state/app-data-provider";

export default function IncidentsPage() {
  const {
    incidents,
    incidentEvents,
    maintenanceWindows,
    services,
    updateIncidentStatus,
    resolveIncident,
    deleteIncident,
    isHydrated,
  } = useAppData();
  const [deletingIncidentId, setDeletingIncidentId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "all">("all");

  const activeIncidents = incidents
    .filter((incident) => incident.status !== "resolved")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const activeFiltered = useMemo(() => {
    if (statusFilter === "all") {
      return activeIncidents;
    }
    return activeIncidents.filter((i) => i.status === statusFilter);
  }, [activeIncidents, statusFilter]);

  const resolvedIncidents = incidents
    .filter((incident) => incident.status === "resolved")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const monitoringIncidents = incidents.filter(
    (incident) => incident.source === "monitoring",
  ).length;

  if (!isHydrated) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="rounded-2xl border border-white/10 bg-zinc-900/30 p-6">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-800" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-800/80" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/50 to-zinc-950/80 p-4 shadow-2xl ring-1 ring-white/5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
              Issues
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Create, track, and resolve incidents across your monitored services. Timestamps use your
              local timezone.
            </p>
          </div>
          <div className="shrink-0">
            <CreateIncidentButton />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 ring-1 ring-cyan-500/10 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Active incidents
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-100 sm:text-2xl">
            {activeIncidents.length}
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 ring-1 ring-violet-500/10 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Resolved incidents
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-100 sm:text-2xl">
            {resolvedIncidents.length}
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 ring-1 ring-amber-500/10 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Monitoring-generated
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-100 sm:text-2xl">
            {monitoringIncidents}
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 ring-1 ring-white/5 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Active maintenance
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-100 sm:text-2xl">
            {
              maintenanceWindows.filter(
                (window) => window.status === "active",
              ).length
            }
          </p>
        </article>
      </section>

      {actionError ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {actionError}
        </div>
      ) : null}

      {incidents.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/30 p-6 text-center sm:p-10">
          <p className="text-3xl" aria-hidden>
            ◆
          </p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-100">No incidents yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            When something breaks, log it here so subscribers and your status page stay in sync.
            Monitoring can also open incidents automatically.
          </p>
          <div className="mt-6 flex justify-center">
            <CreateIncidentButton />
          </div>
        </section>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["all" as const, "All active"],
                ["investigating" as const, "Investigating"],
                ["identified" as const, "Identified"],
                ["monitoring" as const, "Monitoring"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setStatusFilter(id)}
                className={[
                  "rounded-full px-3 py-1.5 text-xs font-medium transition",
                  statusFilter === id
                    ? "bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-500/40"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
          <section className="space-y-3 rounded-2xl border border-white/10 bg-zinc-900/30 p-4 ring-1 ring-white/5 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
                Active incidents
              </h3>
              <p className="text-sm font-medium text-zinc-500">
                {activeFiltered.length} shown · {activeIncidents.length} active
              </p>
            </div>
            <IncidentsList
              incidents={activeFiltered}
              incidentEvents={incidentEvents}
              services={services}
              onUpdateStatus={updateIncidentStatus}
              onResolve={resolveIncident}
              onDelete={async (incidentId) => {
                setActionError(null);
                setDeletingIncidentId(incidentId);
                try {
                  await deleteIncident(incidentId);
                } catch (error) {
                  setActionError(
                    error instanceof Error
                      ? error.message
                      : "Could not delete incident. Please try again.",
                  );
                } finally {
                  setDeletingIncidentId(null);
                }
              }}
              deletingIncidentId={deletingIncidentId}
            />
          </section>

          <ResolvedIncidentsArchive count={resolvedIncidents.length}>
            <IncidentsList
              incidents={resolvedIncidents}
              incidentEvents={incidentEvents}
              services={services}
              onUpdateStatus={updateIncidentStatus}
              onResolve={resolveIncident}
              onDelete={async (incidentId) => {
                setActionError(null);
                setDeletingIncidentId(incidentId);
                try {
                  await deleteIncident(incidentId);
                } catch (error) {
                  setActionError(
                    error instanceof Error
                      ? error.message
                      : "Could not delete incident. Please try again.",
                  );
                } finally {
                  setDeletingIncidentId(null);
                }
              }}
              deletingIncidentId={deletingIncidentId}
            />
          </ResolvedIncidentsArchive>
        </div>
      )}
    </div>
  );
}
