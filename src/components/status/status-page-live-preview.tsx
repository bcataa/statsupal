"use client";

import type { ServiceStatus } from "@/lib/models/monitoring";

export type StatusPageLivePreviewProps = {
  pageTitle: string;
  slug: string;
  brandColor: string;
  operationalColor: string;
  logoUrl?: string;
  serviceName: string;
  overallStatus: ServiceStatus | "sample";
  uptimeLabel?: string;
  className?: string;
};

/** Small, self-contained preview for onboarding and design tools (not the public page). */
export function StatusPageLivePreview({
  pageTitle,
  slug,
  brandColor,
  operationalColor,
  logoUrl,
  serviceName,
  overallStatus,
  uptimeLabel = "100.0% uptime",
  className = "",
}: StatusPageLivePreviewProps) {
  const allOk = overallStatus === "operational" || overallStatus === "sample";
  const headline = allOk ? "All systems operational" : "Some systems may be impacted";

  return (
    <div
      className={[
        "overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)]",
        className,
      ].join(" ")}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5"
        style={{ background: `linear-gradient(135deg, ${brandColor}33 0%, transparent 55%)` }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-black/40"
            style={{ boxShadow: `0 0 0 1px ${brandColor}44` }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold" style={{ color: brandColor }}>
                {pageTitle.trim().charAt(0).toUpperCase() || "S"}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{pageTitle || "Your status page"}</p>
            <p className="truncate text-[11px] text-zinc-500">statsupal.app/status/{slug || "your-page"}</p>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold text-white/90"
          style={{ borderColor: `${brandColor}88`, background: `${brandColor}22` }}
        >
          Get updates
        </button>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
        <div
          className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-3 sm:px-4"
          style={{ background: `${operationalColor}14` }}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg text-white"
            style={{ background: operationalColor }}
          >
            {allOk ? "✓" : "!"}
          </span>
          <p className="text-sm font-semibold text-white sm:text-base">{headline}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span style={{ color: operationalColor }}>✓</span>
              <p className="min-w-0 truncate text-sm text-zinc-100">{serviceName}</p>
            </div>
            <p className="text-xs font-semibold tabular-nums" style={{ color: operationalColor }}>
              {uptimeLabel}
            </p>
          </div>
          <div className="mt-3 flex h-8 items-end gap-px overflow-hidden rounded-md bg-zinc-900/80 px-0.5 pb-0.5 pt-1">
            {Array.from({ length: 48 }).map((_, i) => {
              const dip = !allOk && i % 11 === 0;
              return (
                <div
                  key={i}
                  className="min-w-0 flex-1 rounded-[1px]"
                  style={{
                    height: `${40 + ((i * 7) % 55)}%`,
                    background: operationalColor,
                    opacity: dip ? 0.35 : 0.85,
                  }}
                />
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-[9px] font-medium uppercase tracking-wider text-zinc-500">
            <span>&lt; 90 days ago</span>
            <span>Today</span>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Recent notices
          </p>
          <p className="mt-2 text-xs text-zinc-600">No incidents—your subscribers see updates here.</p>
        </div>
      </div>
    </div>
  );
}
