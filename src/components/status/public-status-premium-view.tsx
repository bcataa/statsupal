"use client";

import Link from "next/link";
import { useState } from "react";
import { FallingStarsCanvas } from "@/components/status/falling-stars-canvas";
import { SubscribeDrawer } from "@/components/status/subscribe-drawer";
import { PublicIncidentHistory } from "@/components/status/public-incident-history";
import { ServiceStatusCard } from "@/components/status/service-status-card";
import { LocalDateTime } from "@/components/ui/local-datetime";
import { getPublicSupportEmail, getPublicSupportMailto } from "@/lib/support/contact-info";
import type { Incident, Service } from "@/lib/models/monitoring";
import type { PublicUptimeBars24hResult, PublicUptimeWindows } from "@/lib/status/public-uptime";
import {
  type StatusPageExtraThemeV1,
  overallAccentColor,
  serviceStatusAccent,
} from "@/lib/models/status-page-theme";
import type { PublicCheckHistoryPoint } from "@/lib/status/public-uptime";

export type PremiumPublicWorkspace = {
  name: string;
  project_name: string | null;
  public_description: string | null;
  support_email: string | null;
  brand_color: string | null;
  operational_color: string | null;
  brand_logo_url: string | null;
  brand_favicon_url: string | null;
};

type OverallStatus = "all-operational" | "partial-outage" | "major-outage";

type Props = {
  workspace: PremiumPublicWorkspace;
  extraTheme?: StatusPageExtraThemeV1;
  projectSlug: string;
  publishedServices: Service[];
  incidents: Incident[];
  serviceLabels: { id: string; name: string }[];
  overallStatus: OverallStatus;
  lastUpdated: string | null;
  uptime: PublicUptimeWindows;
  bars24h: PublicUptimeBars24hResult;
  historyByServiceId?: Record<string, PublicCheckHistoryPoint[]>;
};

function headlineFor(status: OverallStatus): string {
  if (status === "major-outage") return "Major outage detected";
  if (status === "partial-outage") return "Partial degradation";
  return "All systems operational";
}
function sublineFor(status: OverallStatus): string {
  if (status === "major-outage") return "Our team is actively investigating and working to restore services.";
  if (status === "partial-outage") return "Some services are experiencing issues. We are monitoring closely.";
  return "Every service is running within normal parameters.";
}

/* ── Animated status ring ─────────────────────────────────────────── */
function StatusRing({ status, color }: { status: OverallStatus; color: string }) {
  const ok = status === "all-operational";
  return (
    <div className="relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
      <div
        className="absolute inset-0 rounded-full border-2 opacity-40"
        style={{ borderColor: color }}
      />
      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16"
        style={{
          background: color,
          boxShadow: `0 0 40px -8px ${color}, 0 0 80px -24px ${color}`,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {ok
            ? <path d="M20 6L9 17l-5-5" />
            : <><line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r="0.5" fill="white" strokeWidth="0" /></>
          }
        </svg>
      </div>
    </div>
  );
}

export function PublicStatusPremiumView({
  workspace,
  extraTheme = {},
  projectSlug,
  publishedServices,
  incidents,
  serviceLabels,
  overallStatus,
  lastUpdated,
  uptime,
  historyByServiceId = {},
}: Props) {
  const brand  = workspace.brand_color      || "#7c3aed";
  const op     = workspace.operational_color || "#10b981";
  const title  = workspace.project_name?.trim() || workspace.name;
  const logo   = extraTheme.logoDarkUrl || workspace.brand_logo_url;
  const accent = overallAccentColor(overallStatus, brand, op, extraTheme);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#01010a] text-white">

      <FallingStarsCanvas />

      {/* ── Hero header ─────────────────────────────────────────────── */}
      <div className="relative z-10 overflow-hidden" style={{ minHeight: 320 }}>
        {/* Subtle brand haze over the hero only */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 50% 0%, ${brand}22 0%, transparent 65%)`,
          }}
        />
        {/* Dot-grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
          {/* Brand bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15"
                style={{ background: `${brand}22` }}
              >
                {logo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={logo} alt="" className="h-full w-full object-contain" />
                  : <span className="text-sm font-bold" style={{ color: brand }}>{title.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div>
                <p className="text-base font-bold tracking-tight">{title}</p>
                <p className="text-[11px] text-zinc-500">slebb.com/status/{projectSlug}</p>
              </div>
            </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-full border px-4 py-1.5 text-xs font-semibold transition hover:opacity-80"
            style={{ borderColor: `${brand}66`, background: `${brand}18`, color: "white" }}
          >
            Get updates
          </button>
          </div>

          {/* Status hero */}
          <div className="mt-10 flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
            <StatusRing status={overallStatus} color={accent.icon} />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: accent.icon }}>
                {headlineFor(overallStatus)}
              </h1>
              <p className="mt-1.5 max-w-lg text-sm leading-6 text-zinc-400">{sublineFor(overallStatus)}</p>
              {lastUpdated && (
                <p className="mt-2 text-xs text-zinc-600">
                  Last updated: <LocalDateTime iso={lastUpdated} />
                </p>
              )}
            </div>
          </div>

          {/* Uptime quick stats */}
          <div className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-3">
            {[
              { label: "24 h", value: uptime.hours24 },
              { label: "7 d",  value: uptime.days7  },
              { label: "30 d", value: uptime.days30 },
            ].map((w) => (
              <div
                key={w.label}
                className="rounded-2xl border border-white/8 px-4 py-3 text-center backdrop-blur-sm"
                style={{ background: `${brand}0f` }}
              >
                <p className="text-xl font-bold tabular-nums" style={{ color: w.value != null && w.value >= 99 ? op : brand }}>
                  {w.value != null ? `${w.value.toFixed(1)}%` : "—"}
                </p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-500">{w.label} uptime</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Services ────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto w-full max-w-4xl space-y-6 px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/8" />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-600">Services</span>
          <div className="h-px flex-1 bg-white/8" />
        </div>

        {publishedServices.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] py-14 text-center text-sm text-zinc-500">
            No published monitors yet — check back soon.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {publishedServices.map((svc) => (
              <ServiceStatusCard
                key={svc.id}
                service={svc}
                points={historyByServiceId[svc.id] ?? []}
                accentColor={serviceStatusAccent(svc.status, op, extraTheme)}
              />
            ))}
          </div>
        )}

        {/* ── Incidents ───────────────────────────────────────────── */}
        {incidents.length > 0 && (
          <>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/8" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-600">Incident history</span>
              <div className="h-px flex-1 bg-white/8" />
            </div>
            <PublicIncidentHistory incidents={incidents} services={serviceLabels} tone="dark" />
          </>
        )}

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer className="border-t border-white/[0.06] pt-8 pb-12 text-center text-[11px] text-zinc-600">
          <p className="flex flex-wrap items-center justify-center gap-x-1.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-white/8 px-3 py-1 text-[10px] font-semibold"
              style={{ background: `${brand}12`, color: brand }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill={brand}><circle cx="5" cy="5" r="5"/></svg>
              Powered by Slebb
            </span>
          </p>
          {workspace.support_email && (
            <p className="mt-3">
              Support:{" "}
              <a href={`mailto:${workspace.support_email}`} className="text-zinc-400 underline underline-offset-2 hover:text-white">
                {workspace.support_email}
              </a>
            </p>
          )}
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <a href={getPublicSupportMailto()} className="hover:text-zinc-300">{getPublicSupportEmail()}</a>
            <span>·</span>
            <Link href="/privacy" className="hover:text-zinc-300">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-zinc-300">Terms</Link>
          </p>
        </footer>
      </div>

      <SubscribeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        projectSlug={projectSlug}
        brand={brand}
      />
    </div>
  );
}
