"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppData } from "@/state/app-data-provider";

function statusColor(status: string) {
  if (status === "operational") return "#34d399";
  if (status === "degraded")    return "#fbbf24";
  if (status === "down")        return "#f87171";
  return "#6b7280";
}

function KpiTile({
  label, value, sub, accent, icon,
}: {
  label: string; value: string; sub?: string; accent: string; icon: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0e18]/70 p-5 backdrop-blur-sm"
      style={{ boxShadow: `0 0 40px -18px ${accent}` }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${accent}60,transparent)` }} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${accent}22`, color: accent }}>
          {icon}
        </span>
      </div>
    </div>
  );
}

function ActivityRow({ dot, text, time }: { dot: string; text: string; time: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: dot, boxShadow: `0 0 6px ${dot}` }} />
      <p className="min-w-0 flex-1 text-sm text-zinc-300">{text}</p>
      <span className="shrink-0 text-xs tabular-nums text-zinc-600">{time}</span>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export default function OverviewPage() {
  const { services, incidents, uptimeSummary, workspace, isHydrated } = useAppData();

  const operational = services.filter((s) => s.status === "operational").length;
  const degraded    = services.filter((s) => s.status === "degraded").length;
  const down        = services.filter((s) => s.status === "down").length;
  const openIncidents = incidents.filter((i) => i.status !== "resolved").length;

  const avgMs = useMemo(() => {
    const live = services.filter((s) => s.responseTimeMs > 0);
    if (!live.length) return 0;
    return Math.round(live.reduce((a, s) => a + s.responseTimeMs, 0) / live.length);
  }, [services]);

  const uptime = uptimeSummary.averageUptimePercentage > 0
    ? uptimeSummary.averageUptimePercentage.toFixed(2) + "%"
    : "—";

  const overallStatus = down > 0 ? "down" : degraded > 0 ? "degraded" : "operational";
  const overallColor  = statusColor(overallStatus);
  const overallLabel  = down > 0 ? "Systems degraded" : degraded > 0 ? "Partial degradation" : "All systems operational";

  const recentActivity = useMemo(() => [
    ...incidents.slice(0, 6).map((i) => ({
      dot: i.status === "resolved" ? "#34d399" : i.severity === "critical" ? "#f87171" : "#fbbf24",
      text: `${i.status === "resolved" ? "✓ Resolved" : "⚠ Incident"}: ${i.title}`,
      time: timeAgo(i.updatedAt),
      key: i.id,
    })),
    ...services.slice(0, 4).map((s) => ({
      dot: statusColor(s.status),
      text: `${s.name} — ${s.status} (${s.responseTimeMs > 0 ? s.responseTimeMs + " ms" : "pending"})`,
      time: s.lastChecked ? timeAgo(s.lastChecked) : "—",
      key: s.id + "_svc",
    })),
  ].sort(() => Math.random() - 0.5).slice(0, 8), [incidents, services]);

  if (!isHydrated) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-white/5" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            {workspace.name}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white">Overview</h1>
        </div>
        <div
          className="flex items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-[#0c0e18]/70 px-4 py-2.5 backdrop-blur-sm"
          style={{ borderColor: `${overallColor}44` }}
        >
          <span
            className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor]"
            style={{ background: overallColor, color: overallColor }}
          />
          <span className="text-sm font-semibold" style={{ color: overallColor }}>
            {overallLabel}
          </span>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Uptime (7d)"
          value={uptime}
          sub={`${services.length} monitors`}
          accent="#34d399"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          }
        />
        <KpiTile
          label="Avg response"
          value={avgMs > 0 ? `${avgMs} ms` : "—"}
          sub={`${operational} operational`}
          accent="#818cf8"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
          }
        />
        <KpiTile
          label="Open incidents"
          value={String(openIncidents)}
          sub={openIncidents === 0 ? "All clear" : `${openIncidents} need attention`}
          accent={openIncidents > 0 ? "#f87171" : "#34d399"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          }
        />
        <KpiTile
          label="Services down"
          value={String(down + degraded)}
          sub={down > 0 ? `${down} down, ${degraded} degraded` : degraded > 0 ? `${degraded} degraded` : "Nothing to worry about"}
          accent={down > 0 ? "#f87171" : degraded > 0 ? "#fbbf24" : "#34d399"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          }
        />
      </div>

      {/* Main two-column */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Services health */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0e18]/70 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-100">Services health</h2>
            <Link href="/services" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
              View all →
            </Link>
          </div>
          {services.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-zinc-500">No services yet.</p>
              <Link href="/services" className="mt-3 inline-flex h-9 items-center rounded-xl bg-indigo-600/80 px-4 text-xs font-semibold text-white hover:bg-indigo-500">
                Add a monitor
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {services.slice(0, 8).map((s) => {
                const c = statusColor(s.status);
                return (
                  <Link
                    key={s.id}
                    href={`/services/${encodeURIComponent(s.id)}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-white/[0.03]"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">{s.name}</p>
                      <p className="truncate text-xs text-zinc-500">
                        {s.url.replace(/^https?:\/\//, "").split("/")[0]}
                      </p>
                    </div>
                    <span className="text-xs font-semibold tabular-nums" style={{ color: c }}>
                      {s.status === "operational" ? (s.responseTimeMs > 0 ? `${s.responseTimeMs} ms` : "—") : s.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Recent activity */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0e18]/70 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <h2 className="text-sm font-semibold text-zinc-100">Recent activity</h2>
              <Link href="/incidents" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
                All incidents →
              </Link>
            </div>
            {recentActivity.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-500">No activity yet.</p>
            ) : (
              <div className="divide-y divide-white/[0.04] px-5">
                {recentActivity.map((a) => (
                  <ActivityRow key={a.key} dot={a.dot} text={a.text} time={a.time} />
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0e18]/70 backdrop-blur-sm">
            <div className="border-b border-white/5 px-5 py-4">
              <h2 className="text-sm font-semibold text-zinc-100">Quick actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4">
              {[
                { label: "Add monitor",     href: "/services",               icon: "⬡", accent: "#818cf8" },
                { label: "New incident",    href: "/incidents",              icon: "◉", accent: "#f87171" },
                { label: "Status page",     href: "/dashboard/status",       icon: "◈", accent: "#34d399" },
                { label: "Team settings",   href: "/team",                   icon: "◎", accent: "#60a5fa" },
                { label: "Notifications",   href: "/settings",               icon: "✦", accent: "#fbbf24" },
                { label: "Customize page",  href: "/settings/status-design", icon: "⬟", accent: "#c084fc" },
              ].map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
                >
                  <span style={{ color: q.accent }}>{q.icon}</span>
                  {q.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
