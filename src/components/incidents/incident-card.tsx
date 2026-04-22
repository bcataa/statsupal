import type { Incident, IncidentEvent, IncidentStatus } from "@/lib/models/monitoring";
import { formatDateTime } from "@/lib/utils/date-time";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { useState } from "react";

type IncidentCardProps = {
  incident: Incident;
  timelineEvents: IncidentEvent[];
  serviceName: string;
  onUpdateStatus: (incidentId: string, status: IncidentStatus) => void;
  onResolve: (incidentId: string, resolutionSummary?: string) => void;
  onDelete: (incidentId: string) => Promise<void>;
  isDeleting: boolean;
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
  timelineEvents,
  serviceName,
  onUpdateStatus,
  onResolve,
  onDelete,
  isDeleting,
}: IncidentCardProps) {
  const nextStatus = getNextStatus(incident.status);
  const isResolved = incident.status === "resolved";
  const [showDetails, setShowDetails] = useState(false);
  const [aiBusy, setAiBusy] = useState<"summarize" | "draft" | null>(null);
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiErrorCode, setAiErrorCode] = useState<string | null>(null);

  const runIncidentAi = async (action: "summarize" | "draft_public_update") => {
    setAiError(null);
    setAiErrorCode(null);
    setAiBusy(action === "summarize" ? "summarize" : "draft");
    try {
      const res = await fetch("/api/ai/incident-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ incidentId: incident.id, action }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        text?: string;
        error?: string;
        code?: string;
      };
      if (!res.ok || !data.ok || !data.text) {
        setAiOutput(null);
        const base = data.error ?? "Something went wrong with the AI request.";
        setAiErrorCode(data.code ?? null);
        if (data.code === "ai_not_configured") {
          setAiError(
            `${base} Your team can enable it under Settings → AI assistant, or use the links below.`,
          );
        } else if (data.code === "ai_error") {
          setAiError(`${base} If this keeps happening, try again in a few minutes.`);
        } else {
          setAiError(base);
        }
        return;
      }
      setAiError(null);
      setAiErrorCode(null);
      setAiOutput(data.text);
    } catch {
      setAiOutput(null);
      setAiErrorCode(null);
      setAiError("We could not reach the server. Check your connection and try again.");
    } finally {
      setAiBusy(null);
    }
  };

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
        "rounded-2xl border border-white/10 bg-zinc-900/40 p-5 ring-1 ring-white/5",
        isResolved ? "opacity-80" : "",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-base font-semibold text-zinc-100">{incident.title}</p>
          <p className="mt-1 text-sm text-zinc-400">Affected service: {serviceName}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
            Source: {incident.source ?? "manual"}
          </p>
          {incident.description && (
            <p className="mt-2 text-sm text-zinc-400">{incident.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge value={incident.status} />
          <StatusBadge value={incident.severity} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-zinc-500 sm:grid-cols-3">
        <p>Started: {formatDateTime(incident.startedAt)}</p>
        <p>Updated: {formatDateTime(incident.updatedAt)}</p>
        <p>
          Resolved: {incident.resolvedAt ? formatDateTime(incident.resolvedAt) : "Not resolved"}
        </p>
      </div>

      {incident.resolutionSummary && (
        <p className="mt-3 rounded-lg border border-white/5 bg-zinc-950/50 px-3 py-2 text-xs text-zinc-400">
          Resolution: {incident.resolutionSummary}
        </p>
      )}

      <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-950/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
          AI assistance (drafts only)
        </p>
        <p className="mt-1 text-[11px] leading-snug text-violet-200/80">
          Suggestions only—does not change monitoring or status. Configure models under{" "}
          <Link href="/settings" className="font-medium underline-offset-2 hover:underline">
            Settings
          </Link>
          .
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void runIncidentAi("summarize")}
            disabled={aiBusy !== null}
            className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200 hover:bg-violet-500/20 disabled:opacity-60"
          >
            {aiBusy === "summarize" ? "Working…" : "Generate summary"}
          </button>
          <button
            type="button"
            onClick={() => void runIncidentAi("draft_public_update")}
            disabled={aiBusy !== null}
            className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200 hover:bg-violet-500/20 disabled:opacity-60"
          >
            {aiBusy === "draft" ? "Working…" : "Draft status update"}
          </button>
        </div>
        {aiError ? (
          <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
            <p>{aiError}</p>
            {aiErrorCode === "ai_not_configured" ? (
              <p className="mt-2">
                <Link
                  href="/settings"
                  className="font-medium text-rose-950 underline-offset-2 hover:underline"
                >
                  Open Settings to configure the AI assistant
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}
        {aiOutput ? (
          <div className="mt-2">
            <label className="text-[10px] font-medium uppercase tracking-wide text-violet-300">
              Output (copy and edit before use)
            </label>
            <textarea
              readOnly
              value={aiOutput}
              className="mt-1 min-h-24 w-full rounded-lg border border-violet-500/30 bg-zinc-950/80 px-2 py-2 text-xs text-zinc-200"
              rows={6}
            />
          </div>
        ) : null}
      </div>

      {!isResolved && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {nextStatus && (
            <button
              type="button"
              onClick={() => onUpdateStatus(incident.id, nextStatus)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/5"
            >
              Mark as {nextStatus}
            </button>
          )}
          <button
            type="button"
            onClick={() => onUpdateStatus(incident.id, "investigating")}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/5"
          >
            Mark as investigating
          </button>
          <button
            type="button"
            onClick={() => onUpdateStatus(incident.id, "monitoring")}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/5"
          >
            Mark as monitoring
          </button>
          <button
            type="button"
            onClick={resolveWithSummary}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
          >
            Resolve incident
          </button>
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/5"
          >
            {showDetails ? "Hide details" : "View details"}
          </button>
          <button
            type="button"
            onClick={async () => {
              const confirmed = window.confirm(
                "Delete this incident permanently? This action cannot be undone.",
              );
              if (!confirmed) {
                return;
              }
              await onDelete(incident.id);
            }}
            disabled={isDeleting}
            className="rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete incident"}
          </button>
        </div>
      )}

      {isResolved && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/5"
            >
              {showDetails ? "Hide details" : "View details"}
            </button>
            <button
              type="button"
              onClick={async () => {
                const confirmed = window.confirm(
                  "Delete this incident permanently? This action cannot be undone.",
                );
                if (!confirmed) {
                  return;
                }
                await onDelete(incident.id);
              }}
              disabled={isDeleting}
              className="rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Deleting..." : "Delete incident"}
            </button>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Incident timeline
          </p>
          {timelineEvents.length === 0 ? (
            <ul className="mt-2 space-y-2 text-sm text-zinc-300">
              <li>Started: {formatDateTime(incident.startedAt)}</li>
              <li>Status updated: {formatDateTime(incident.updatedAt)}</li>
              {incident.resolvedAt && <li>Resolved: {formatDateTime(incident.resolvedAt)}</li>}
            </ul>
          ) : (
            <ul className="mt-2 space-y-2 text-sm text-zinc-300">
              {timelineEvents.map((event) => (
                <li key={event.id}>
                  <span className="font-medium">{event.source}</span> — {event.message}
                  <span className="ml-1 text-xs text-zinc-500">
                    ({formatDateTime(event.createdAt)})
                  </span>
                </li>
              ))}
            </ul>
          )}
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
