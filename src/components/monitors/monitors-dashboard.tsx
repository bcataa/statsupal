"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AddServiceButton } from "@/components/services/add-service-button";
import { ServiceEditDialog } from "@/components/services/service-edit-dialog";
import type { Service } from "@/lib/models/monitoring";
import { useAppData } from "@/state/app-data-provider";

type HistoryPoint = {
  status: string;
  response_time_ms: number;
  checked_at: string;
};

function displayUrl(url: string): string {
  try { return new URL(url).host || url; } catch { return url; }
}

/* ── status helpers ─────────────────────────────────────────────── */
function statusColor(status: Service["status"]): string {
  if (status === "operational") return "#34d399";
  if (status === "degraded")    return "#fbbf24";
  if (status === "down")        return "#f87171";
  return "#6b7280";
}
function statusLabel(status: Service["status"]): string {
  if (status === "operational") return "Operational";
  if (status === "degraded")    return "Degraded";
  if (status === "down")        return "Down";
  return "Pending";
}

function formatMs(ms: number): string {
  if (ms <= 0) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function availabilityFromPoints(points: HistoryPoint[]): number | null {
  if (!points.length) return null;
  const up = points.filter((p) => p.status === "operational").length;
  return Math.round((up / points.length) * 1000) / 10;
}

/* ── ECG-style sparkline ─────────────────────────────────────────── */
function Sparkline({ points, color }: { points: HistoryPoint[]; color: string }) {
  const slice = points.slice(-40);
  const W = 200, H = 44;

  if (!slice.length) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="h-11 w-full" preserveAspectRatio="none">
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 3" />
      </svg>
    );
  }

  const cap = Math.max(1, ...slice.map((p) => p.response_time_ms), 200);
  const pts = slice.map((p, i): [number, number] => {
    const x = (i / Math.max(slice.length - 1, 1)) * W;
    const norm = Math.min(p.response_time_ms > 0 ? p.response_time_ms : cap * 0.12, cap) / cap;
    const y = H - 4 - norm * (H - 10);
    return [x, y];
  });

  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }

  const last = pts[pts.length - 1];
  const fillPath = `${d} L ${last[0]},${H} L ${pts[0][0]},${H} Z`;
  const gradId = `ecg-${color.replace("#","")}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-11 w-full" preserveAspectRatio="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}99)` }} />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color}
        style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
    </svg>
  );
}

/* ── service initial icon ────────────────────────────────────────── */
function ServiceIcon({ name }: { name: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  const hue = (name.charCodeAt(0) * 37 + name.charCodeAt(1) * 13) % 360;
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
      style={{ background: `hsl(${hue},55%,35%)` }}
    >
      {initials}
    </span>
  );
}

/* ── single monitor card ─────────────────────────────────────────── */
function MonitorCard({
  service, points, onEdit, onDelete,
}: {
  service: Service;
  points: HistoryPoint[];
  onEdit: (s: Service) => void;
  onDelete: (id: string) => void;
}) {
  const color = statusColor(service.status);
  const avail = availabilityFromPoints(points);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0e18]/70 p-4 backdrop-blur-sm transition hover:border-white/15 hover:bg-[#0f1120]/80">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_7px_currentColor]"
            style={{ background: color, color }}
            aria-hidden
          />
          <div className="min-w-0">
            <Link
              href={`/services/${encodeURIComponent(service.id)}`}
              className="block truncate text-sm font-semibold text-zinc-100 hover:text-white"
            >
              {service.name}
            </Link>
            <p className="truncate text-[11px] text-zinc-500">{displayUrl(service.url)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-semibold" style={{ color }}>
            {statusLabel(service.status)}
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-600 opacity-0 transition group-hover:opacity-100 hover:bg-white/10 hover:text-zinc-300"
              aria-label="Actions"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-xl border border-white/10 bg-[#0d0f14] py-1 shadow-2xl">
                <button type="button" onClick={() => { onEdit(service); setMenuOpen(false); }}
                  className="block w-full px-4 py-2 text-left text-xs text-zinc-300 hover:bg-white/5">Edit</button>
                <Link href={`/services/${encodeURIComponent(service.id)}`}
                  className="block px-4 py-2 text-xs text-zinc-300 hover:bg-white/5" onClick={() => setMenuOpen(false)}>Open</Link>
                <button type="button" onClick={() => { void onDelete(service.id); setMenuOpen(false); }}
                  className="block w-full px-4 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10">Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="overflow-hidden rounded-md">
        <Sparkline points={points} color={color} />
      </div>

      {/* Bottom stats */}
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

/* ── main dashboard ─────────────────────────────────────────────── */
type MonitorsDashboardProps = { services: Service[] };

export function MonitorsDashboard({ services }: MonitorsDashboardProps) {
  const { updateService, deleteService } = useAppData();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [editing, setEditing] = useState<Service | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pointsById, setPointsById] = useState<Record<string, HistoryPoint[]>>({});

  useEffect(() => {
    if (!services.length) return;
    let cancel = false;
    void (async () => {
      const next: Record<string, HistoryPoint[]> = {};
      await Promise.all(
        services.map(async (s) => {
          const res = await fetch(`/api/monitor/history/${encodeURIComponent(s.id)}`);
          if (cancel) return;
          if (res.ok) {
            const data = (await res.json()) as { points?: HistoryPoint[] };
            next[s.id] = data.points ?? [];
          } else {
            next[s.id] = [];
          }
        }),
      );
      if (!cancel) setPointsById(next);
    })();
    return () => { cancel = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services.map((s) => s.id).join(",")]);

  const handleDelete = async (serviceId: string) => {
    if (!window.confirm("Delete this monitor?")) return;
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

  const filtered = q
    ? services.filter(
        (s) =>
          s.name.toLowerCase().includes(q.toLowerCase()) ||
          s.url.toLowerCase().includes(q.toLowerCase()),
      )
    : services;

  return (
    <div className="mx-auto w-full max-w-7xl">
      {editing && (
        <ServiceEditDialog service={editing} onClose={() => setEditing(null)} />
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Monitors</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{services.length} monitor{services.length !== 1 ? "s" : ""}</p>
        </div>
        <AddServiceButton className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/8 border border-white/10 px-4 text-sm font-semibold text-zinc-100 transition hover:bg-white/12 hover:border-white/20" />
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}
      {deletingId && (
        <p className="mb-4 text-sm text-zinc-500">Removing monitor…</p>
      )}

      {/* Card grid */}
      {services.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-16 text-center">
          <p className="text-3xl" aria-hidden>◇</p>
          <h3 className="mt-3 text-lg font-semibold text-zinc-100">No monitors yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
            Add a URL to start uptime checks. Monitors run on your selected interval and show live latency here.
          </p>
          <div className="mt-6 flex justify-center">
            <AddServiceButton className="inline-flex h-10 items-center justify-center rounded-xl border border-violet-500/40 bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-500" />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((s) => (
            <MonitorCard
              key={s.id}
              service={s}
              points={pointsById[s.id] ?? []}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
