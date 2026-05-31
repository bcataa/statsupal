"use client";

import { MonitorSparkline } from "@/components/monitors/monitor-sparkline";
import type { Service } from "@/lib/models/monitoring";

export type ServiceHistoryPoint = {
  status: string;
  response_time_ms: number;
};

type ServiceStatusCardProps = {
  service: Service;
  points: ServiceHistoryPoint[];
  accentColor: string;
};

function displayUrl(url: string): string {
  if (!url.trim()) return "";
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).host || url;
  } catch {
    return url;
  }
}

function statusLabel(status: Service["status"]): string {
  if (status === "operational") return "Operational";
  if (status === "degraded") return "Degraded";
  if (status === "down") return "Down";
  return "Pending";
}

function formatMs(ms: number): string {
  if (ms <= 0) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function availabilityFromPoints(points: ServiceHistoryPoint[]): number | null {
  if (!points.length) return null;
  const up = points.filter((p) => p.status === "operational" || p.status === "degraded").length;
  return Math.round((up / points.length) * 1000) / 10;
}

export function ServiceStatusCard({ service, points, accentColor }: ServiceStatusCardProps) {
  const urlLabel = displayUrl(service.url) || service.description || "";
  const avail = availabilityFromPoints(points);

  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0e18]/70 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_7px_currentColor]"
            style={{ background: accentColor, color: accentColor }}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-100">{service.name}</p>
            {urlLabel ? (
              <p className="truncate text-[11px] text-zinc-500">{urlLabel}</p>
            ) : null}
          </div>
        </div>
        <span className="shrink-0 text-xs font-semibold" style={{ color: accentColor }}>
          {statusLabel(service.status)}
        </span>
      </div>

      <div className="overflow-hidden rounded-md">
        <MonitorSparkline points={points} className="h-11 w-full" maxBars={40} />
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-2">
        <div>
          <p className="text-xs text-zinc-500">Response time</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-200">
            {formatMs(service.responseTimeMs)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Uptime</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-200">
            {avail != null ? `${avail}%` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Build sparkline points from bar heights when no check history exists yet. */
export function barsToSparklinePoints(
  barHeights: number[] | null | undefined,
): ServiceHistoryPoint[] {
  if (!barHeights?.length) return [];
  return barHeights.map((h) => ({
    status: "operational",
    response_time_ms: Math.round(Math.max(0.08, h) * 400),
  }));
}
