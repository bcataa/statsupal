"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AddServiceButton } from "@/components/services/add-service-button";
import { ServiceEditDialog } from "@/components/services/service-edit-dialog";
import { MonitorLatencyTooltip } from "@/components/monitors/monitor-latency-tooltip";
import { MonitorSparkline } from "@/components/monitors/monitor-sparkline";
import type { Service } from "@/lib/models/monitoring";
import { formatServiceResponse } from "@/lib/utils/monitoring-display";
import { useAppData } from "@/state/app-data-provider";
import { Switch } from "@/components/ui/switch";

type HistoryPoint = {
  status: string;
  response_time_ms: number;
  checked_at: string;
};

function methodLabel(service: Service): string {
  if (service.checkType === "ping") {
    return "PING";
  }
  if (service.checkType === "api" || service.checkType === "http") {
    return "GET";
  }
  return "GET";
}

function displayUrl(url: string): string {
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
}

function statusDotClass(status: Service["status"]): string {
  if (status === "operational") {
    return "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]";
  }
  if (status === "degraded") {
    return "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400";
  }
  return "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500";
}

function statusTooltip(
  status: Service["status"],
): { label: string; tone: "ok" | "warn" | "down" | "pending" } {
  if (status === "operational") {
    return { label: "Up", tone: "ok" };
  }
  if (status === "degraded") {
    return { label: "Degraded", tone: "warn" };
  }
  if (status === "down") {
    return { label: "Down", tone: "down" };
  }
  return { label: "Pending", tone: "pending" };
}

function availabilityFromPoints(points: HistoryPoint[]): number | null {
  if (points.length === 0) {
    return null;
  }
  const up = points.filter((p) => p.status === "operational").length;
  return Math.round((up / points.length) * 1000) / 10;
}

type SubTab = "monitors" | "alerts";

type MonitorRowProps = {
  service: Service;
  points: HistoryPoint[];
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
  onTogglePublished: (service: Service, next: boolean) => void;
  searchQuery: string;
};

function MonitorRow({
  service,
  points,
  onEdit,
  onDelete,
  onTogglePublished,
  searchQuery,
}: MonitorRowProps) {
  const [hover, setHover] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const q = searchQuery.trim().toLowerCase();
  if (
    q &&
    !service.name.toLowerCase().includes(q) &&
    !service.url.toLowerCase().includes(q)
  ) {
    return null;
  }

  const avail = availabilityFromPoints(points);
  const regionLabel = "Check source";
  const tip = statusTooltip(service.status);

  return (
    <div
      className={[
        "group relative flex flex-col gap-3 rounded-xl border p-3 transition-all sm:grid sm:grid-cols-[minmax(0,1.2fr)_8.5rem_7.5rem_12.5rem_minmax(5.5rem,1fr)] sm:items-center sm:gap-x-3 sm:gap-y-0",
        service.status === "operational" || service.status === "degraded"
          ? "border-cyan-500/10 bg-zinc-900/30 hover:border-cyan-500/30 hover:shadow-[0_0_24px_-8px_rgba(6,182,212,0.25)]"
          : "border-rose-500/20 bg-rose-950/10 hover:border-rose-500/30",
      ].join(" ")}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div ref={anchorRef} className="min-w-0 sm:col-span-1">
        <div className="flex items-start gap-2">
          <span className={statusDotClass(service.status)} title={service.status} aria-hidden />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-violet-500/25 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-violet-200">
                {methodLabel(service)}
              </span>
              <Link
                href={`/services/${encodeURIComponent(service.id)}`}
                className="min-w-0 font-medium text-zinc-100 hover:text-cyan-200"
              >
                {service.name}
              </Link>
            </div>
            <p className="mt-0.5 truncate text-xs text-zinc-500">{displayUrl(service.url)}</p>
          </div>
        </div>
        <MonitorLatencyTooltip
          anchorRef={anchorRef}
          show={hover}
          latencyMs={service.responseTimeMs}
          regionLabel={regionLabel}
          lastCheckIso={service.lastChecked}
          statusLabel={tip.label}
          statusTone={tip.tone}
        />
      </div>

      <div className="flex items-center sm:justify-center">
        <MonitorSparkline points={points} />
      </div>

      <p className="text-sm font-medium tabular-nums text-zinc-200 sm:text-right">
        {avail != null ? `${avail}%` : "—"}
        <span className="ml-1 text-[10px] font-normal text-zinc-500">up</span>
      </p>

      <div
        className="flex min-w-0 items-center justify-end gap-2.5 sm:min-h-[2.5rem] sm:justify-end sm:pl-0"
        title="Response time and public visibility on your status page"
      >
        <span className="min-w-0 max-w-full shrink text-right text-sm leading-snug break-words text-zinc-300 tabular-nums sm:min-w-0 sm:max-w-[6.5rem]">
          {formatServiceResponse({
            status: service.status,
            responseTimeMs: service.responseTimeMs,
            lastChecked: service.lastChecked,
          })}
        </span>
        <div className="shrink-0">
          <Switch
            checked={service.isPublished}
            onCheckedChange={(next) => void onTogglePublished(service, next)}
            aria-label={`Status page visibility for ${service.name}`}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-end gap-0.5 border-t border-white/5 pt-2 sm:border-0 sm:pt-0 sm:pl-0">
        <button
          type="button"
          onClick={() => onEdit(service)}
          className="rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
        >
          Edit
        </button>
        <Link
          href={`/services/${encodeURIComponent(service.id)}`}
          className="hidden rounded-lg px-2 py-1.5 text-xs font-medium text-cyan-400/90 hover:bg-cyan-500/10 sm:inline"
        >
          Open
        </Link>
        <button
          type="button"
          onClick={() => void onDelete(service.id)}
          className="rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-500 hover:bg-rose-500/10 hover:text-rose-200"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

type MonitorsDashboardProps = {
  services: Service[];
};

export function MonitorsDashboard({ services }: MonitorsDashboardProps) {
  const { updateService, deleteService } = useAppData();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [subTab, setSubTab] = useState<SubTab>("monitors");
  const [editing, setEditing] = useState<Service | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pointsById, setPointsById] = useState<Record<string, HistoryPoint[]>>({});

  useEffect(() => {
    if (services.length === 0) {
      return;
    }
    let cancel = false;
    void (async () => {
      const next: Record<string, HistoryPoint[]> = {};
      await Promise.all(
        services.map(async (s) => {
          const res = await fetch(`/api/monitor/history/${encodeURIComponent(s.id)}`);
          if (cancel) {
            return;
          }
          if (res.ok) {
            const data = (await res.json()) as { points?: HistoryPoint[] };
            next[s.id] = data.points ?? [];
          } else {
            next[s.id] = [];
          }
        }),
      );
      if (!cancel) {
        setPointsById(next);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [services.map((s) => s.id).join(",")]);

  const handleDelete = async (serviceId: string) => {
    const ok = window.confirm(
      "Delete this monitor? It will be removed from monitoring and status views.",
    );
    if (!ok) {
      return;
    }
    try {
      setDeletingId(serviceId);
      await deleteService(serviceId);
    } catch (e) {
      console.error(e);
      setErrorMessage("Could not delete monitor.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublished = async (service: Service, next: boolean) => {
    try {
      setErrorMessage(null);
      await updateService({
        id: service.id,
        name: service.name,
        url: service.url,
        checkType: service.checkType,
        checkInterval: service.checkInterval,
        timeoutMs: service.timeoutMs,
        failureThreshold: service.failureThreshold,
        retryCount: service.retryCount,
        description: service.description,
        isPublished: next,
      });
    } catch (e) {
      console.error(e);
      setErrorMessage("Could not update visibility.");
    }
  };

  const operational = services.filter((s) => s.status === "operational").length;
  const avgLatency =
    services.length > 0
      ? Math.round(
          services.reduce((acc, s) => acc + s.responseTimeMs, 0) / services.length,
        )
      : 0;

  if (subTab === "alerts") {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-2xl border border-white/10 bg-[#0a0c10]/80 p-1 shadow-2xl ring-1 ring-white/[0.04]">
          <div className="flex items-center justify-between border-b border-white/5 px-3 py-2 sm:px-4">
            <div className="flex gap-1 rounded-lg bg-zinc-900/80 p-0.5">
              <button
                type="button"
                onClick={() => setSubTab("monitors")}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-200"
              >
                Monitors
              </button>
              <button
                type="button"
                className="rounded-md bg-white/5 px-3 py-1.5 text-sm font-medium text-zinc-100 shadow-sm ring-1 ring-cyan-500/30"
              >
                Alerts
              </button>
            </div>
          </div>
          <div className="p-6 text-sm text-zinc-400">
            Alert routing rules and thresholds will show here. For now, open{" "}
            <Link className="text-cyan-400 hover:underline" href="/incidents">
              Issues
            </Link>{" "}
            to track incidents, or check notification settings in{" "}
            <Link className="text-cyan-400 hover:underline" href="/settings">
              Settings
            </Link>
            .
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      {editing ? (
        <ServiceEditDialog service={editing} onClose={() => setEditing(null)} />
      ) : null}
      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {errorMessage}
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0d0f16] to-[#08090d] p-1 shadow-2xl ring-1 ring-violet-500/10">
        <div className="flex flex-col gap-3 border-b border-white/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex gap-0.5 rounded-lg bg-zinc-900/90 p-0.5">
              <button
                type="button"
                onClick={() => setSubTab("monitors")}
                className="rounded-md bg-violet-600/20 px-3 py-1.5 text-sm font-medium text-violet-100 shadow-[0_0_16px_-4px_rgba(139,92,246,0.5)] ring-1 ring-violet-500/40"
              >
                Monitors
              </button>
              <button
                type="button"
                onClick={() => setSubTab("alerts")}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-300"
              >
                Alerts
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              {operational}/{services.length} healthy · ~{avgLatency} ms avg
            </p>
          </div>
          <AddServiceButton className="inline-flex h-9 items-center justify-center rounded-xl border border-violet-500/40 bg-violet-600 px-3 text-sm font-medium text-white shadow-lg shadow-violet-900/30 hover:bg-violet-500" />
        </div>

        {services.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-2xl" aria-hidden>
              ◇
            </p>
            <h3 className="mt-2 text-lg font-semibold text-zinc-100">No monitors yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              Add a URL to start uptime checks. Monitors run on your selected interval and show live
              latency here.
            </p>
            <div className="mt-6 flex justify-center">
              <AddServiceButton className="inline-flex h-10 items-center justify-center rounded-xl border border-violet-500/40 bg-violet-600 px-4 text-sm font-medium text-white shadow-lg shadow-violet-900/30 hover:bg-violet-500" />
            </div>
          </div>
        ) : (
          <>
            <div className="hidden gap-2 border-b border-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:grid sm:grid-cols-[minmax(0,1.2fr)_8.5rem_7.5rem_12.5rem_minmax(5.5rem,1fr)] sm:items-center sm:pl-1">
              <span>Monitor</span>
              <span className="text-center">Uptime (checks)</span>
              <span className="text-right">Available</span>
              <span className="text-right">Response</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="space-y-1.5 p-2 sm:p-3">
              {services.map((s) => (
                <MonitorRow
                  key={s.id}
                  service={s}
                  points={pointsById[s.id] ?? []}
                  onEdit={setEditing}
                  onDelete={handleDelete}
                  onTogglePublished={handleTogglePublished}
                  searchQuery={q}
                />
              ))}
            </div>
            {deletingId ? (
              <p className="px-4 pb-3 text-center text-xs text-zinc-500">Working…</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
