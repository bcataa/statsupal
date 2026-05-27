"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { PublicIncidentHistory } from "@/components/status/public-incident-history";
import { LocalDateTime, LocalTimestampOrText } from "@/components/ui/local-datetime";
import { getPublicSupportEmail, getPublicSupportMailto } from "@/lib/support/contact-info";
import type { Incident, Service } from "@/lib/models/monitoring";
import type { PublicUptimeBars24hResult, PublicUptimeWindows } from "@/lib/status/public-uptime";
import {
  type StatusPageExtraThemeV1,
  overallAccentColor,
  serviceStatusAccent,
} from "@/lib/models/status-page-theme";
import { formatServiceResponse } from "@/lib/utils/monitoring-display";

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

/* ── Full-page animated space background ─────────────────────────── */
function SpaceCanvas({ brand }: { brand: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    c.width = w; c.height = h;
    const onResize = () => { w = window.innerWidth; h = window.innerHeight; c.width = w; c.height = h; };
    window.addEventListener("resize", onResize);

    type Star = { x: number; y: number; r: number; alpha: number; ts: number; to: number };
    type Shooter = { x: number; y: number; len: number; spd: number; ang: number; life: number; maxLife: number; active: boolean };

    const STAR_N = 340;
    const stars: Star[] = Array.from({ length: STAR_N }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() < 0.1 ? 1.5 + Math.random() : 0.3 + Math.random() * 0.9,
      alpha: 0.25 + Math.random() * 0.75,
      ts: 0.4 + Math.random() * 1.8,
      to: Math.random() * Math.PI * 2,
    }));

    const SHOOT_N = 5;
    const shooters: Shooter[] = Array.from({ length: SHOOT_N }, () => ({
      x: 0, y: 0, len: 0, spd: 0, ang: 0, life: 0, maxLife: 1, active: false,
    }));

    const spawn = (s: Shooter) => {
      s.x = Math.random() * w * 0.8; s.y = Math.random() * h * 0.4;
      s.len = 90 + Math.random() * 160; s.spd = 7 + Math.random() * 9;
      s.ang = Math.PI / 5 + Math.random() * (Math.PI / 6);
      s.maxLife = (s.len / s.spd) * 1.5; s.life = 0; s.active = true;
    };
    shooters.forEach((s, i) => setTimeout(() => spawn(s), i * 2600 + Math.random() * 2000));

    let t = 0;
    const draw = () => {
      t += 0.016;

      // Background
      ctx.fillStyle = "#01010a";
      ctx.fillRect(0, 0, w, h);

      // Nebula — brand colour haze top-centre
      const nb = ctx.createRadialGradient(w * 0.5, 0, 0, w * 0.5, 0, w * 0.55);
      nb.addColorStop(0, `${brand}1a`);
      nb.addColorStop(0.5, `${brand}08`);
      nb.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = nb;
      ctx.fillRect(0, 0, w, h);

      // Teal nebula bottom-left
      const tb = ctx.createRadialGradient(w * 0.05, h * 0.85, 0, w * 0.05, h * 0.85, w * 0.28);
      tb.addColorStop(0, "rgba(0,50,90,0.20)");
      tb.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = tb;
      ctx.fillRect(0, 0, w, h);

      // Planet — top-right
      const px = w * 0.82, py = -h * 0.03, pr = Math.min(w, h) * 0.42;
      const pulse = 1 + 0.018 * Math.sin(t * 0.45);

      // Halo
      for (let i = 5; i >= 1; i--) {
        const hr = pr * pulse * (1 + i * 0.20);
        const g = ctx.createRadialGradient(px, py, pr * 0.65, px, py, hr);
        g.addColorStop(0, `rgba(100,30,190,${0.07 / i})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath(); ctx.arc(px, py, hr, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
      }

      // Body
      const pg = ctx.createRadialGradient(px - pr * 0.3, py + pr * 0.25, pr * 0.04, px, py, pr * pulse);
      pg.addColorStop(0, "#a855e8"); pg.addColorStop(0.25, "#7c22d4");
      pg.addColorStop(0.6, "#4a0ea4"); pg.addColorStop(0.85, "#2a0870"); pg.addColorStop(1, "#110440");
      ctx.beginPath(); ctx.arc(px, py, pr * pulse, 0, Math.PI * 2);
      ctx.fillStyle = pg; ctx.fill();

      // Surface sweep band
      ctx.save();
      ctx.beginPath(); ctx.arc(px, py, pr * pulse, 0, Math.PI * 2); ctx.clip();
      const bx = (Math.sin(t * 0.08) * 0.5 + 0.5) * pr * 2 - pr;
      const band = ctx.createLinearGradient(px + bx - pr * 0.4, py, px + bx + pr * 0.4, py);
      band.addColorStop(0, "rgba(180,80,255,0)");
      band.addColorStop(0.5, "rgba(180,80,255,0.06)");
      band.addColorStop(1, "rgba(180,80,255,0)");
      ctx.fillStyle = band; ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
      ctx.restore();

      // Rim
      const rim = ctx.createRadialGradient(px, py, pr * pulse * 0.84, px, py, pr * pulse * 1.04);
      rim.addColorStop(0, "rgba(200,100,255,0)"); rim.addColorStop(0.65, "rgba(170,80,255,0.16)"); rim.addColorStop(1, "rgba(210,130,255,0.44)");
      ctx.beginPath(); ctx.arc(px, py, pr * pulse * 1.04, 0, Math.PI * 2);
      ctx.fillStyle = rim; ctx.fill();

      // Stars
      for (const s of stars) {
        const a = s.alpha * (0.55 + 0.45 * Math.sin(t * s.ts + s.to));
        if (s.r > 1.3) {
          ctx.strokeStyle = `rgba(255,255,255,${a * 0.3})`; ctx.lineWidth = 0.4;
          ctx.beginPath(); ctx.moveTo(s.x - s.r * 3, s.y); ctx.lineTo(s.x + s.r * 3, s.y);
          ctx.moveTo(s.x, s.y - s.r * 3); ctx.lineTo(s.x, s.y + s.r * 3); ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill();
      }

      // Shooting stars
      for (const s of shooters) {
        if (!s.active) continue;
        s.life++;
        const p = s.life / s.maxLife;
        const hx = s.x + Math.cos(s.ang) * s.spd * s.life;
        const hy = s.y + Math.sin(s.ang) * s.spd * s.life;
        const tx = hx - Math.cos(s.ang) * s.len;
        const ty = hy - Math.sin(s.ang) * s.len;
        const fade = p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7;
        const gr = ctx.createLinearGradient(tx, ty, hx, hy);
        gr.addColorStop(0, "rgba(255,255,255,0)");
        gr.addColorStop(0.6, `rgba(200,180,255,${fade * 0.5})`);
        gr.addColorStop(1, `rgba(255,255,255,${fade * 0.9})`);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy);
        ctx.strokeStyle = gr; ctx.lineWidth = 1.2; ctx.stroke();
        if (s.life >= s.maxLife) { s.active = false; setTimeout(() => spawn(s), 2000 + Math.random() * 5000); }
      }

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.95);
      vig.addColorStop(0, "rgba(0,0,0,0)"); vig.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = vig; ctx.fillRect(0, 0, w, h);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { window.removeEventListener("resize", onResize); cancelAnimationFrame(rafRef.current); };
  }, [brand]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}

/* ── Animated status ring ─────────────────────────────────────────── */
function StatusRing({ status, color }: { status: OverallStatus; color: string }) {
  const ok = status === "all-operational";
  return (
    <div className="relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
      {/* Outer pulse ring */}
      <div
        className="absolute inset-0 animate-ping rounded-full opacity-20"
        style={{ background: color }}
      />
      {/* Static outer ring */}
      <div
        className="absolute inset-0 rounded-full border-2 opacity-40"
        style={{ borderColor: color }}
      />
      {/* Inner solid */}
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

/* ── Uptime bar row ───────────────────────────────────────────────── */
function UptimeBars({ bars, color, hasHourly }: { bars: number[]; color: string; hasHourly: boolean }) {
  const slice = bars.slice(-60);
  return (
    <div className="flex h-8 items-end gap-[2px] overflow-hidden rounded-lg">
      {(hasHourly ? slice : Array.from({ length: 60 })).map((b, i) => {
        const val = hasHourly ? (b as number) : 35 + ((i * 7) % 55);
        const h = hasHourly ? (val < 0 ? 12 : Math.max(20, Math.min(100, val))) : val;
        return (
          <div
            key={i}
            className="min-w-0 flex-1 rounded-[1px] transition-all duration-300"
            style={{
              height: `${h}%`,
              background: color,
              opacity: hasHourly && val < 0 ? 0.18 : 0.82,
            }}
          />
        );
      })}
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
  bars24h,
}: Props) {
  const brand  = workspace.brand_color      || "#7c3aed";
  const op     = workspace.operational_color || "#10b981";
  const title  = workspace.project_name?.trim() || workspace.name;
  const logo   = extraTheme.logoDarkUrl || workspace.brand_logo_url;
  const accent = overallAccentColor(overallStatus, brand, op, extraTheme);
  const desc   = workspace.public_description || "Real-time system status and incident updates.";

  const upLabel =
    uptime.days30 != null ? `${uptime.days30.toFixed(2)}%`
    : uptime.days7 != null ? `${uptime.days7.toFixed(2)}%`
    : uptime.hours24 != null ? `${uptime.hours24.toFixed(2)}%`
    : "—";

  const bars      = bars24h.values;
  const hasHourly = bars.some((b) => b !== -1);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#01010a] text-white">

      {/* ── Full-page animated space background ─── */}
      <SpaceCanvas brand={brand} />

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
              className="rounded-full border px-4 py-1.5 text-xs font-semibold transition hover:opacity-80"
              style={{ borderColor: `${brand}66`, background: `${brand}18`, color: "white" }}
            >
              Subscribe to updates
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
          <div className="space-y-3">
            {publishedServices.map((svc) => {
              const color = serviceStatusAccent(svc.status, op, extraTheme);
              const isOk  = svc.status === "operational";
              return (
                <div
                  key={svc.id}
                  className="overflow-hidden rounded-2xl border border-white/[0.07] backdrop-blur-md"
                  style={{ background: `linear-gradient(135deg, ${color}0c 0%, rgba(6,6,18,0.55) 60%)` }}
                >
                  {/* Top accent line */}
                  <div className="h-[1.5px] w-full" style={{ background: `linear-gradient(90deg, ${color}00, ${color}88, ${color}00)` }} />

                  <div className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Status dot with glow */}
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            background: color,
                            boxShadow: `0 0 8px 2px ${color}66`,
                          }}
                        />
                        <div>
                          <p className="font-semibold text-zinc-100">{svc.name}</p>
                          {svc.description && (
                            <p className="text-xs text-zinc-500">{svc.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
                          style={{ background: `${color}20`, color }}
                        >
                          {svc.status === "operational" ? "Operational" : svc.status === "degraded" ? "Degraded" : svc.status === "down" ? "Down" : "Checking"}
                        </span>
                        <span className="hidden text-sm font-semibold tabular-nums sm:block" style={{ color }}>
                          {upLabel}
                        </span>
                      </div>
                    </div>

                    {/* Uptime bars */}
                    <div className="mt-4">
                      <UptimeBars bars={bars} color={color} hasHourly={hasHourly} />
                      <div className="mt-1 flex justify-between text-[9px] font-medium uppercase tracking-wider text-zinc-700">
                        <span>60 checks ago</span>
                        <span>Now</span>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-zinc-500">
                      <span>
                        Checked:{" "}
                        <span className="text-zinc-400">
                          {svc.lastChecked ? <LocalTimestampOrText value={svc.lastChecked} /> : "—"}
                        </span>
                      </span>
                      <span>
                        Response:{" "}
                        <span className="text-zinc-400">
                          {formatServiceResponse({ status: svc.status, responseTimeMs: svc.responseTimeMs, lastChecked: svc.lastChecked })}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
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
    </div>
  );
}
