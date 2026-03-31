import type { Incident, IncidentStatus } from "@/lib/models/monitoring";
import { formatDateTime } from "@/lib/utils/date-time";
import { StatusBadge } from "@/components/ui/status-badge";
import { useState } from "react";

type IncidentCardProps = {
  incident: Incident;
  serviceName: string;
  onUpdateStatus: (incidentId: string, status: IncidentStatus) => void;
  onResolve: (incidentId: string, resolutionSummary?: string) => void;
};

function getNextStatus(status: IncidentStatus): IncidentStatus | null {
  if (status === "investigating") {
    return "identified";
  }

  if (status === "identified") {
    return "monitoring";
  }

  return null;
}

export function IncidentCard({
  incident,
  serviceName,
  onUpdateStatus,
  onResolve,
}: IncidentCardProps) {
  const nextStatus = getNextStatus(incident.status);
  const isResolved = incident.status === "resolved";
  const [showDetails, setShowDetails] = useState(false);

  const resolveWithSummary = () => {
    const summary = window.prompt(
      "Optional resolution summary",
      incident.resolutionSummary || "",
    );
    onResolve(incident.id, summary || undefined);
  };

  return (
    <article
      className={[
        "rounded-2xl border bg-white p-5 shadow-sm",
        isResolved ? "border-zinc-200/80 opacity-85" : "border-zinc-200",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-base font-semibold text-zinc-900">{incident.title}</p>
          <p className="mt-1 text-sm text-zinc-600">Affected service: {serviceName}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
            Source: {incident.source ?? "manual"}
          </p>
          {incident.description && (
            <p className="mt-2 text-sm text-zinc-600">{incident.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge value={incident.status} />
          <StatusBadge value={incident.severity} />
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-zinc-500 sm:grid-cols-3">
        <p>Started: {formatDateTime(incident.startedAt)}</p>
        <p>Updated: {formatDateTime(incident.updatedAt)}</p>
        <p>
          Resolved: {incident.resolvedAt ? formatDateTime(incident.resolvedAt) : "Not resolved"}
        </p>
      </div>

      {incident.resolutionSummary && (
        <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          Resolution: {incident.resolutionSummary}
        </p>
      )}

      {!isResolved && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {nextStatus && (
            <button
              type="button"
              onClick={() => onUpdateStatus(incident.id, nextStatus)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Mark as {nextStatus}
            </button>
          )}
          <button
            type="button"
            onClick={() => onUpdateStatus(incident.id, "monitoring")}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Mark as monitoring
          </button>
          <button
            type="button"
            onClick={resolveWithSummary}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
          >
            Resolve incident
          </button>
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {showDetails ? "Hide details" : "View details"}
          </button>
        </div>
      )}

      {isResolved && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {showDetails ? "Hide details" : "View details"}
          </button>
        </div>
      )}

      {showDetails && (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Incident timeline
          </p>
          <ul className="mt-2 space-y-2 text-sm text-zinc-700">
            <li>Started: {formatDateTime(incident.startedAt)}</li>
            <li>Status updated: {formatDateTime(incident.updatedAt)}</li>
            {incident.resolvedAt && <li>Resolved: {formatDateTime(incident.resolvedAt)}</li>}
          </ul>
          {!incident.resolutionSummary && incident.status !== "resolved" && (
            <p className="mt-2 text-xs text-zinc-500">
              No resolution summary yet.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
