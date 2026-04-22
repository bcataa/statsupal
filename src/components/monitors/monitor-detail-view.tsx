"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Service } from "@/lib/models/monitoring";
import { formatTimestampOrText } from "@/lib/utils/date-time";
import { formatServiceResponse } from "@/lib/utils/monitoring-display";
import { ResponseInspector } from "@/components/monitors/response-inspector";
import { ServiceEditDialog } from "@/components/services/service-edit-dialog";

type HistoryPoint = {
  status: string;
  response_time_ms: number;
  checked_at: string;
};

function methodLabel(service: Service): string {
  if (service.checkType === "ping") {
    return "PING";
  }
  return "GET";
}

function windowStartMs(range: string, now: number): number {
  const h = 3600 * 1000;
  const d = 24 * h;
  if (range === "24h") {
    return now - d;
  }
  if (range === "7d") {
    return now - 7 * d;
  }
  if (range === "30d") {
    return now - 30 * d;
  }
  return now - d;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)] ?? 0;
}

type LineChartProps = {
  points: { t: number; ms: number }[];
};

function LineChart({ points }: LineChartProps) {
  const w = 560;
  const h = 160;
  const pad = 8;
  if (points.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-white/5 bg-black/30 text-sm text-zinc-500">
        Not enough history in this window yet.
      </div>
    );
  }
  const ms = points.map((p) => p.ms);
  const min = Math.min(...ms);
  const max = Math.max(...ms, min + 1);
  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const dx = t1 - t0 || 1;

  const path = points
    .map((p, i) => {
      const x = pad + ((p.t - t0) / dx) * (w - pad * 2);
      const y = h - pad - ((p.ms - min) / (max - min)) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      className="h-auto w-full max-h-44"
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="lineG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${path} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`}
        fill="url(#lineG)"
      />
      <path d={path} stroke="#a78bfa" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

type ArcStatProps = {
  label: string;
  value: number;
  cap: number;
  color: string;
};

function ArcStat({ label, value, cap, color }: ArcStatProps) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const pct = cap > 0 ? Math.min(1, value / cap) : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} stroke="currentColor" strokeWidth="6" className="text-white/5" fill="none" />
        <circle
          cx="48"
          cy="48"
          r={r}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeDasharray={`${pct * c} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <p className="text-center text-xs text-zinc-500">{label}</p>
    </div>
  );
}

type MonitorDetailViewProps = {
  service: Service;
  initialPoints: HistoryPoint[];
};

export function MonitorDetailView({ service, initialPoints }: MonitorDetailViewProps) {
  const [range, setRange] = useState("24h");
  const [editing, setEditing] = useState(false);
  const [points, setPoints] = useState<HistoryPoint[]>(initialPoints);

  useEffect(() => {
    setPoints(initialPoints);
  }, [initialPoints]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const start = windowStartMs(range, now);
    return points
      .filter((p) => {
        const t = new Date(p.checked_at).getTime();
        return t >= start;
      })
      .map((p) => ({
        ...p,
        t: new Date(p.checked_at).getTime(),
      }));
  }, [points, range]);

  const linePoints = useMemo(
    () =>
      filtered.map((p) => ({
        t: p.t,
        ms: p.response_time_ms,
      })),
    [filtered],
  );

  const stats = useMemo(() => {
    const ms = filtered.map((p) => p.response_time_ms);
    const sorted = [...ms].sort((a, b) => a - b);
    const avg = ms.length ? ms.reduce((a, b) => a + b, 0) / ms.length : 0;
    const p95 = percentile(sorted, 95);
    const up = filtered.filter((p) => p.status === "operational").length;
    const avail = filtered.length ? (up / filtered.length) * 100 : 0;
    return { avg, p95, avail, count: filtered.length };
  }, [filtered]);

  const lastCheck = service.lastChecked;

  return (
    <div className="space-y-6">
      {editing ? <ServiceEditDialog service={service} onClose={() => setEditing(false)} /> : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/services"
            className="text-sm font-medium text-cyan-400/90 hover:text-cyan-300"
          >
            ← Monitors
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{service.name}</h1>
            <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs font-bold text-violet-200">
              {methodLabel(service)}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-zinc-500">{service.url}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-zinc-500">
            <span className="sr-only">Time range</span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="rounded-lg border border-white/10 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-200"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-xl border border-violet-500/40 bg-violet-600/80 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500"
          >
            Edit monitor
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/40 to-[#07080c] p-5 ring-1 ring-violet-500/10">
          <h3 className="text-sm font-medium text-zinc-400">Performance</h3>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-zinc-500">Average latency</p>
              <p className="text-2xl font-semibold tabular-nums text-violet-200">
                {Math.round(stats.avg)} ms
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">P95</p>
              <p className="text-xl font-semibold tabular-nums text-zinc-200">
                {Math.round(stats.p95)} ms
              </p>
            </div>
            <ArcStat label="P95 / max in window" value={stats.p95} cap={2000} color="#a78bfa" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/40 to-[#07080c] p-5 ring-1 ring-cyan-500/10">
          <h3 className="text-sm font-medium text-zinc-400">Availability</h3>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-zinc-500">In selected window</p>
              <p className="text-2xl font-semibold tabular-nums text-cyan-200">
                {stats.count ? stats.avail.toFixed(1) : "—"}%
              </p>
            </div>
            <div className="text-right text-sm text-zinc-500">
              <p>Live status: {service.status}</p>
              <p>Recent check: {formatServiceResponse({ status: service.status, responseTimeMs: service.responseTimeMs, lastChecked: lastCheck })}</p>
            </div>
            <ArcStat
              label="Uptime in window"
              value={stats.avail}
              cap={100}
              color="#22d3ee"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#080a0f]/80 p-4">
        <h3 className="text-sm font-medium text-zinc-400">Response time</h3>
        <p className="mt-1 text-xs text-zinc-600">
          {stats.count} checks in {range === "24h" ? "24h" : range === "7d" ? "7d" : "30d"}{" "}
          — last {formatTimestampOrText(lastCheck)}
        </p>
        <div className="mt-2 overflow-x-auto">
          <LineChart points={linePoints} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/20 p-4 text-sm text-zinc-400">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Last check</h4>
          <dl className="mt-3 space-y-1.5">
            <div className="flex justify-between gap-2">
              <dt>Status</dt>
              <dd className="text-zinc-200">{service.status}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Latency</dt>
              <dd className="font-mono text-zinc-200">{service.responseTimeMs} ms</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Time</dt>
              <dd>{formatTimestampOrText(lastCheck)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Region</dt>
              <dd>Probe region</dd>
            </div>
          </dl>
        </div>
      </div>

      <ResponseInspector
        targetUrl={service.url}
        bodyPlaceholder="Statsupal stores per-check status and response time. Response bodies and headers are not saved to the database yet, so the Body tab is illustrative."
      />
    </div>
  );
}
