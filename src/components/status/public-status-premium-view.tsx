import Link from "next/link";
import { PublicIncidentHistory } from "@/components/status/public-incident-history";
import { LocalDateTime, LocalTimestampOrText } from "@/components/ui/local-datetime";
import { getPublicSupportEmail, getPublicSupportMailto } from "@/lib/support/contact-info";
import type { Incident, Service } from "@/lib/models/monitoring";
import type { PublicUptimeBars24hResult, PublicUptimeWindows } from "@/lib/status/public-uptime";
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
  if (status === "major-outage") return "Some systems are down";
  if (status === "partial-outage") return "Partially degraded";
  return "All systems operational";
}

export function PublicStatusPremiumView({
  workspace,
  projectSlug,
  publishedServices,
  incidents,
  serviceLabels,
  overallStatus,
  lastUpdated,
  uptime,
  bars24h,
}: Props) {
  const brand = workspace.brand_color || "#7c3aed";
  const op = workspace.operational_color || "#10b981";
  const title = workspace.project_name?.trim() || workspace.name;
  const desc =
    workspace.public_description || "Real-time system status and incident updates.";
  const upLabel =
    uptime.days30 != null
      ? `${uptime.days30.toFixed(1)}% uptime`
      : uptime.days7 != null
        ? `${uptime.days7.toFixed(1)}% uptime`
        : uptime.hours24 != null
          ? `${uptime.hours24.toFixed(1)}% uptime`
          : "Uptime building";

  const bars = bars24h.values;
  const hasHourly = bars.some((b) => b !== -1);

  return (
    <main className="min-w-0 overflow-x-hidden bg-black text-white">
      <div
        className="border-b border-white/10 px-3 py-6 sm:px-6 sm:py-10"
        style={{
          background: `linear-gradient(180deg, ${brand}44 0%, transparent 100%)`,
        }}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-black/50">
              {workspace.brand_logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={workspace.brand_logo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold" style={{ color: brand }}>
                  {title.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold tracking-tight">{title}</p>
              <p className="truncate text-xs text-zinc-500">statsupal.app/status/{projectSlug}</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-full border px-4 py-2 text-xs font-semibold text-white/95"
            style={{ borderColor: `${brand}99`, background: `${brand}22` }}
          >
            Get updates
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-6 px-3 py-8 sm:px-6 sm:py-12">
        <p className="text-center text-sm text-zinc-400">{desc}</p>
        {lastUpdated ? (
          <p className="text-center text-xs text-zinc-600">
            Last updated <LocalDateTime iso={lastUpdated} />
          </p>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
          <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-7">
            <div
              className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 px-3 py-3 sm:px-4"
              style={{ background: `${op}18` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg text-white"
                style={{ background: op }}
              >
                {overallStatus === "all-operational" ? "✓" : "!"}
              </span>
              <p className="text-base font-semibold">{headlineFor(overallStatus)}</p>
            </div>

            {publishedServices.length === 0 ? (
              <p className="text-center text-sm text-zinc-500">
                No published monitors yet—check back soon.
              </p>
            ) : (
              <div className="space-y-4">
                {publishedServices.map((service) => (
                  <div key={service.id} className="rounded-xl border border-white/10 bg-black/35 px-3 py-3 sm:px-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span style={{ color: op }}>✓</span>
                        <span className="min-w-0 truncate font-medium text-zinc-100">
                          {service.name}
                        </span>
                      </div>
                      <span className="text-xs font-semibold tabular-nums" style={{ color: op }}>
                        {upLabel}
                      </span>
                    </div>
                    <div className="mt-3 flex h-7 items-end gap-px overflow-hidden rounded-md bg-zinc-900/90 px-0.5 pb-0.5">
                      {hasHourly
                        ? bars.slice(-48).map((b, i) => (
                            <div
                              key={i}
                              className="min-w-0 flex-1 rounded-[1px]"
                              style={{
                                height: `${b < 0 ? 12 : Math.max(18, Math.min(100, b))}%`,
                                background: op,
                                opacity: b < 0 ? 0.2 : 0.85,
                              }}
                            />
                          ))
                        : Array.from({ length: 48 }).map((_, i) => (
                            <div
                              key={i}
                              className="min-w-0 flex-1 rounded-[1px]"
                              style={{
                                height: `${35 + ((i * 5) % 50)}%`,
                                background: op,
                                opacity: 0.5,
                              }}
                            />
                          ))}
                    </div>
                    <div className="mt-1 flex justify-between text-[9px] font-medium uppercase tracking-wider text-zinc-600">
                      <span>Earlier</span>
                      <span>Now</span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-zinc-500 sm:grid-cols-2">
                      <p>
                        Last checked:{" "}
                        {service.lastChecked ? (
                          <LocalTimestampOrText value={service.lastChecked} />
                        ) : (
                          "—"
                        )}
                      </p>
                      <p>
                        Response:{" "}
                        {formatServiceResponse({
                          status: service.status,
                          responseTimeMs: service.responseTimeMs,
                          lastChecked: service.lastChecked,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] px-4 py-4 sm:px-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Uptime</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {(
              [
                { label: "24 hours", value: uptime.hours24 },
                { label: "7 days", value: uptime.days7 },
                { label: "30 days", value: uptime.days30 },
              ] as const
            ).map((w) => (
              <div key={w.label} className="rounded-xl border border-white/10 bg-zinc-950/50 py-3">
                <p className="text-lg font-semibold tabular-nums text-white">
                  {w.value != null ? `${w.value.toFixed(1)}%` : "—"}
                </p>
                <p className="mt-1 text-[10px] text-zinc-500">{w.label}</p>
              </div>
            ))}
          </div>
        </div>

        <PublicIncidentHistory incidents={incidents} services={serviceLabels} tone="dark" />

        <footer className="border-t border-white/10 pt-8 pb-10 text-center text-[11px] text-zinc-500">
          {workspace.support_email ? (
            <p>
              Contact:{" "}
              <a className="text-cyan-300 underline underline-offset-2" href={`mailto:${workspace.support_email}`}>
                {workspace.support_email}
              </a>
            </p>
          ) : null}
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>Statsupal</span>
            <span className="hidden sm:inline">·</span>
            <a className="text-cyan-300 underline underline-offset-2" href={getPublicSupportMailto()}>
              {getPublicSupportEmail()}
            </a>
            <span className="hidden sm:inline">·</span>
            <Link href="/privacy" className="hover:text-zinc-300">
              Privacy
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link href="/terms" className="hover:text-zinc-300">
              Terms
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
