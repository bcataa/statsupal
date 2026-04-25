"use client";

import { useSyncExternalStore } from "react";
import type { ServiceStatus } from "@/lib/models/monitoring";
import { formatServiceResponse } from "@/lib/utils/monitoring-display";
import {
  headlineForOverall,
  type PublicOverallStatus,
} from "@/components/status/status-page-preview-helpers";
import {
  type StatusPageExtraThemeV1,
  overallAccentColor,
  serviceStatusAccent,
} from "@/lib/models/status-page-theme";

export type StatusPagePreviewService = {
  name: string;
  url: string;
  status: ServiceStatus;
  lastChecked?: string;
  responseTimeMs?: number;
};

export type StatusPageLivePreviewProps = {
  pageTitle: string;
  slug: string;
  brandColor: string;
  operationalColor: string;
  logoUrl?: string;
  /** Shown in the mini “browser tab” and header when set. */
  faviconUrl?: string;
  /** When set, used in the dark header area instead of `logoUrl`. */
  logoDarkUrl?: string;
  /** Custom colors for degraded / outage / pending (see public status page). */
  extraTheme?: StatusPageExtraThemeV1;
  /** Legacy single service row when `previewServices` is omitted. */
  serviceUrl?: string;
  serviceName: string;
  /** Legacy: driving headline when `overallPublic` is not passed. */
  overallStatus: ServiceStatus | "sample";
  /**
   * Preferred overall headline model (aligns with public status page).
   * When set, supersedes headline derived from `overallStatus`.
   */
  overallPublic?: PublicOverallStatus;
  uptimeLabel?: string;
  publicDescription?: string;
  isUnpublished?: boolean;
  /** Recent notices: date + title. */
  notices?: { id: string; line1: string; line2: string }[];
  /** When set, show one card per public component. */
  previewServices?: StatusPagePreviewService[];
  /**
   * Bar fill heights 0–1, left-to-right (e.g. 48–64 segments).
   * When null/omitted, uses a synthetic 90-style strip.
   */
  barHeights?: number[] | null;
  className?: string;
};

/**
 * In-dashboard public status preview (not the real route): mirrors premium public layout
 * and updates from workspace design state.
 */
export function StatusPageLivePreview({
  pageTitle,
  slug,
  brandColor,
  operationalColor,
  logoUrl,
  logoDarkUrl,
  faviconUrl,
  extraTheme,
  serviceName,
  serviceUrl,
  overallStatus,
  overallPublic,
  uptimeLabel = "100.0% uptime",
  publicDescription,
  isUnpublished,
  notices,
  previewServices,
  barHeights: barHeightsFromProps,
  className = "",
}: StatusPageLivePreviewProps) {
  const hostLabel = useSyncExternalStore(
    () => () => undefined,
    () => (typeof window !== "undefined" ? window.location.host : "yoursite.com"),
    () => "yoursite.com",
  );

  const overall: PublicOverallStatus =
    overallPublic ??
    (() => {
      if (overallStatus === "down") {
        return "major-outage";
      }
      if (overallStatus === "degraded" || overallStatus === "pending") {
        return "partial-outage";
      }
      return "all-operational";
    })();

  const displayTitle = pageTitle.trim() || "Your project";
  const headerLogo = logoDarkUrl || logoUrl;
  const tabIcon = faviconUrl || logoUrl;
  const themeExtras = extraTheme ?? {};
  const overallBanner = overallAccentColor(overall, brandColor, operationalColor, themeExtras);
  const desc =
    publicDescription?.trim() || "Real-time system status and incident updates.";

  const headline = headlineForOverall(overall);
  const allOk = overall === "all-operational";

  const defaultDisplayUrl = (serviceUrl || serviceName).trim() || "https://yoursite.com";
  const rows: StatusPagePreviewService[] =
    previewServices && previewServices.length > 0
      ? previewServices
      : [
          {
            name: serviceName || "Service",
            url: defaultDisplayUrl,
            status:
              overallStatus === "down"
                ? "down"
                : overallStatus === "degraded"
                  ? "degraded"
                  : overallStatus === "pending"
                    ? "pending"
                    : "operational",
          },
        ];

  const targetBars = 56;
  const barHeights =
    barHeightsFromProps && barHeightsFromProps.length > 0
      ? barHeightsFromProps
      : null;

  function glyphFor(s: ServiceStatus) {
    if (s === "down") {
      return "!";
    }
    if (s === "degraded" || s === "pending") {
      return "–";
    }
    return "✓";
  }

  function rowAccent(s: ServiceStatus): string {
    return serviceStatusAccent(s, operationalColor, themeExtras);
  }

  function statusTitle(s: ServiceStatus): string {
    if (s === "down") {
      return "Down";
    }
    if (s === "degraded") {
      return "Degraded";
    }
    if (s === "pending") {
      return "Checking";
    }
    return "Operational";
  }

  return (
    <div
      className={[
        "overflow-hidden rounded-2xl border border-white/10 bg-[#080808] text-left shadow-[0_0_60px_-20px_rgba(124,58,237,0.45)]",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-2 border-b border-white/10 bg-zinc-950/90 px-3 py-2.5 sm:px-4">
        <div className="hidden shrink-0 gap-1.5 sm:flex" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/5 bg-black/50 px-2.5 py-1.5 text-[11px] text-zinc-500">
          {tabIcon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tabIcon} alt="" className="h-4 w-4 shrink-0 rounded-sm object-cover" />
          ) : (
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-[8px] font-bold text-white"
              style={{ background: brandColor }}
            >
              {displayTitle.charAt(0).toUpperCase() || "S"}
            </span>
          )}
          <span className="min-w-0 truncate">
            {hostLabel}/status/{slug || "your-page"}
          </span>
        </div>
      </div>

      {isUnpublished ? (
        <div
          className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-center text-xs font-medium text-amber-100/90"
          role="status"
        >
          Preview only — this page is not public yet. Visitors will see a short “not published” message
          until you enable publishing in Settings.
        </div>
      ) : null}

      <div
        className="px-0"
        style={{
          background: `linear-gradient(180deg, ${brandColor}12 0%, transparent 48%), #080808`,
        }}
      >
        <div
          className="border-b border-white/10 px-4 py-6 sm:px-8"
          style={{
            background: `linear-gradient(180deg, ${brandColor}33 0%, transparent 100%)`,
          }}
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-black/50">
                {headerLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={headerLogo} alt="" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-base font-bold" style={{ color: brandColor }}>
                    {displayTitle.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-tight text-white">
                  {displayTitle}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {hostLabel}/status/{slug || "page"}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="shrink-0 self-start rounded-full border px-4 py-2 text-xs font-semibold text-white/95 transition hover:bg-white/5"
              style={{ borderColor: `${brandColor}80`, background: `${brandColor}22` }}
            >
              Get updates
            </button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-8 sm:py-8">
          <p className="text-center text-sm text-zinc-400">{desc}</p>

          <div
            className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 px-3 py-3.5 sm:px-4"
            style={{ background: overallBanner.bg, borderColor: "rgba(255,255,255,0.08)" }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg text-white shadow-lg"
              style={{
                background: overallBanner.icon,
                boxShadow: `0 0 24px ${overallBanner.icon}55`,
              }}
            >
              {allOk ? "✓" : "!"}
            </span>
            <p className="min-w-0 text-base font-semibold text-white sm:text-lg">{headline}</p>
          </div>

          {rows.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-zinc-950/50 px-4 py-6 text-center text-sm text-zinc-500">
              No published monitors on this page yet. Publish a component or add a monitor to fill this
              preview.
            </p>
          ) : (
            <div className="space-y-4">
              {rows.map((service, index) => {
                const showUrl = service.url.trim() || "https://…";
                const linkHref = showUrl.startsWith("http") ? showUrl : `https://${showUrl}`;
                const barColor = rowAccent(service.status);
                return (
                  <div
                    key={`${service.name}-${index}`}
                    className="rounded-xl border border-white/10 bg-zinc-950/50 p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
                      <div className="flex min-w-0 items-start gap-2">
                        <span className="mt-0.5 text-base" style={{ color: barColor }}>
                          {glyphFor(service.status)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-zinc-100">{service.name}</p>
                          <a
                            href={linkHref}
                            className="mt-0.5 block min-w-0 break-all text-xs text-cyan-300/85 underline-offset-2 hover:underline"
                            onClick={(e) => e.preventDefault()}
                          >
                            {showUrl}
                          </a>
                        </div>
                      </div>
                      <div className="shrink-0 text-right sm:pl-2">
                        <p className="text-xs text-zinc-500">{statusTitle(service.status)}</p>
                        <p
                          className="text-sm font-semibold tabular-nums"
                          style={{ color: barColor }}
                        >
                          {uptimeLabel}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex h-10 items-end gap-px overflow-hidden rounded-md bg-zinc-900/90 px-0.5 pb-0.5 pt-1.5">
                      {barHeights
                        ? barHeights.map((h, i) => {
                            const dip = !allOk && i % 11 === 0;
                            return (
                              <div
                                key={i}
                                className="min-w-0 flex-1 rounded-[1px]"
                                style={{
                                  height: `${Math.min(1, h) * 100}%`,
                                  background: barColor,
                                  opacity: dip ? 0.3 : 0.88,
                                }}
                              />
                            );
                          })
                        : Array.from({ length: targetBars }).map((_, i) => {
                            const dip = !allOk && i % 11 === 0;
                            return (
                              <div
                                key={i}
                                className="min-w-0 flex-1 rounded-[1px]"
                                style={{
                                  height: `${32 + ((i * 5) % 60)}%`,
                                  background: barColor,
                                  opacity: dip ? 0.3 : 0.88,
                                }}
                              />
                            );
                          })}
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                      <span>90 days ago</span>
                      <span>Today</span>
                    </div>
                    {service.lastChecked || service.responseTimeMs != null ? (
                      <div className="mt-3 text-xs text-zinc-500">
                        {formatServiceResponse({
                          status: service.status,
                          responseTimeMs: service.responseTimeMs ?? 0,
                          lastChecked: service.lastChecked ?? "",
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-white/10 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Recent notices
            </p>
            {notices && notices.length > 0 ? (
              <ul className="mt-3 divide-y divide-white/10">
                {notices.map((n) => (
                  <li key={n.id} className="py-3 first:pt-0">
                    <p className="text-xs text-zinc-500">{n.line1}</p>
                    <p className="mt-0.5 text-sm text-zinc-200">{n.line2}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">
                No incident notices in the last view. You&apos;re all clear, or you haven&apos;t posted a
                notice yet.
              </p>
            )}
          </div>

          <p className="pt-2 text-center text-[10px] text-zinc-600">
            Preview · Powered by <span className="text-zinc-500">Statsupal</span>
          </p>
        </div>
      </div>
    </div>
  );
}
