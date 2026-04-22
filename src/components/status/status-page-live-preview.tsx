"use client";

import { useEffect, useState } from "react";
import type { ServiceStatus } from "@/lib/models/monitoring";

export type StatusPageLivePreviewProps = {
  pageTitle: string;
  slug: string;
  brandColor: string;
  operationalColor: string;
  logoUrl?: string;
  /** Shown in the mini “browser tab” and header when set. */
  faviconUrl?: string;
  /** Shown on the service row (e.g. https://example.com). Falls back to serviceName. */
  serviceUrl?: string;
  serviceName: string;
  overallStatus: ServiceStatus | "sample";
  uptimeLabel?: string;
  className?: string;
};

/**
 * Full-page style preview (inspired by modern status UIs) for the wizard and design settings.
 * Not the real public page — uses the same colors and content model.
 */
export function StatusPageLivePreview({
  pageTitle,
  slug,
  brandColor,
  operationalColor,
  logoUrl,
  faviconUrl,
  serviceName,
  serviceUrl,
  overallStatus,
  uptimeLabel = "100.0% uptime",
  className = "",
}: StatusPageLivePreviewProps) {
  const [hostLabel, setHostLabel] = useState("yoursite.com");
  useEffect(() => {
    setHostLabel(typeof window !== "undefined" ? window.location.host : "yoursite.com");
  }, []);

  const allOk = overallStatus === "operational" || overallStatus === "sample";
  const headline = allOk ? "All systems operational" : "Some systems may be impacted";
  const displayService = (serviceUrl || serviceName).trim() || "https://yoursite.com";
  const tabIcon = faviconUrl || logoUrl;

  return (
    <div
      className={[
        "overflow-hidden rounded-2xl border border-white/10 bg-[#080808] text-left shadow-2xl",
        className,
      ].join(" ")}
    >
      {/* Mini browser chrome */}
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
              {pageTitle.trim().charAt(0).toUpperCase() || "S"}
            </span>
          )}
          <span className="min-w-0 truncate">
            {hostLabel}/status/{slug || "your-page"}
          </span>
        </div>
      </div>

      {/* Public page body — Instatus-style hierarchy, Statsupal branding in copy */}
      <div
        className="px-4 py-6 sm:px-8 sm:py-8"
        style={{
          background: `linear-gradient(180deg, ${brandColor}12 0%, transparent 42%), #080808`,
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl md:text-3xl">
              {pageTitle.trim() || "Your project"}{" "}
              <span className="font-medium text-zinc-500">— Status</span>
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Live uptime and incident notices for your visitors.
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 self-start rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white/95 backdrop-blur-sm transition hover:bg-white/10"
            style={{ boxShadow: `0 0 0 1px ${brandColor}30` }}
          >
            Get updates
          </button>
        </div>

        <div
          className="mt-8 flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3.5"
          style={{ background: `${operationalColor}12` }}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base text-white shadow-lg"
            style={{ background: operationalColor, boxShadow: `0 0 24px ${operationalColor}55` }}
          >
            {allOk ? "✓" : "!"}
          </span>
          <p className="text-base font-semibold text-white sm:text-lg">{headline}</p>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/60 p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-3">
            <a
              href={displayService.startsWith("http") ? displayService : `https://${displayService}`}
              className="min-w-0 break-all text-sm font-medium text-cyan-300/95 underline-offset-2 hover:underline"
              onClick={(e) => e.preventDefault()}
            >
              {displayService}
            </a>
            <span className="text-sm text-zinc-500">— {allOk ? "Operational" : "Degraded"}</span>
            <span className="text-sm font-semibold tabular-nums sm:ml-auto" style={{ color: operationalColor }}>
              {uptimeLabel}
            </span>
          </div>

          <p className="mt-1 text-xs text-zinc-600 sm:hidden">Uptime is estimated from your checks.</p>

          <div className="mt-4 flex h-10 items-end gap-px overflow-hidden rounded-md bg-zinc-900/90 px-0.5 pb-0.5 pt-1.5">
            {Array.from({ length: 56 }).map((_, i) => {
              const dip = !allOk && i % 11 === 0;
              return (
                <div
                  key={i}
                  className="min-w-0 flex-1 rounded-[1px]"
                  style={{
                    height: `${32 + ((i * 5) % 60)}%`,
                    background: operationalColor,
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
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Recent notices</p>
          <p className="mt-2 text-sm text-zinc-600">No open incidents. Subscribers only get emails when you post a notice.</p>
        </div>

        <p className="mt-6 text-center text-[10px] text-zinc-600">
          Preview · Powered by <span className="text-zinc-500">Statsupal</span>
        </p>
      </div>
    </div>
  );
}
