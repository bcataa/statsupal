"use client";

import type { PublicUptimeBars24hResult, PublicUptimeWindows } from "@/lib/status/public-uptime";
import { formatLocalHourRangeLabel } from "@/lib/utils/date-time";

type Props = {
  uptime: PublicUptimeWindows;
  bars24h: PublicUptimeBars24hResult;
};

function barTone(pct: number): string {
  if (pct >= 99) {
    return "bg-emerald-500";
  }
  if (pct >= 95) {
    return "bg-amber-400";
  }
  return "bg-rose-400";
}

function formatUptimeCell(value: number | null): { main: string; sub?: string } {
  if (value === null) {
    return { main: "—", sub: "No checks yet" };
  }
  return { main: `${value.toFixed(2)}%` };
}

export function PublicUptimeSection({ uptime, bars24h }: Props) {
  const { values: bars, windowStartMs } = bars24h;
  const hasHourlyData = bars.some((b) => b !== -1);
  const hasAnyWindowData =
    uptime.hours24 !== null || uptime.days7 !== null || uptime.days30 !== null;
  const onlyLongerWindowHasChecks =
    uptime.hours24 === null &&
    uptime.days7 === null &&
    uptime.days30 !== null;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold text-zinc-900 sm:text-xl">Uptime</h2>
      <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
        Based on automated checks stored for this status page (operational and degraded count as up).
        Percentages use a rolling window; labels and charts follow your local time.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
        {(
          [
            { label: "24 hours", value: uptime.hours24 },
            { label: "7 days", value: uptime.days7 },
            { label: "30 days", value: uptime.days30 },
          ] as const
        ).map((item) => {
          const formatted = formatUptimeCell(item.value);
          return (
            <div
              key={item.label}
              className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3 text-center sm:px-4"
            >
              <p className="text-xl font-semibold tabular-nums text-zinc-900 sm:text-3xl">
                {formatted.main}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{item.label}</p>
              {formatted.sub ? (
                <p className="mt-1 text-[10px] leading-snug text-zinc-400">{formatted.sub}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {onlyLongerWindowHasChecks ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-950">
          The 30-day figure includes older checks. There have been no checks in the last 7 days, so 24h
          and 7d stay empty until your monitors run again. The hourly chart only covers the last 24
          hours.
        </p>
      ) : null}

      {!hasAnyWindowData ? (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-center sm:mt-8">
          <p className="text-sm font-medium text-zinc-700">No uptime history yet</p>
          <p className="mt-1 text-xs text-zinc-500">
            Once monitoring runs checks for published services, rolling uptime will appear here.
          </p>
        </div>
      ) : null}

      <div className="mt-6 sm:mt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Last 24 hours</p>
        {!hasHourlyData ? (
          <div className="mt-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center">
            <p className="text-sm font-medium text-zinc-700">No hourly history yet</p>
            <p className="mt-1 text-xs text-zinc-500">
              Uptime bars appear after checks run for this page. If you just added services, check back
              soon.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-2 overflow-x-auto overflow-y-hidden pb-1 [-webkit-overflow-scrolling:touch]">
              <div
                className="flex h-14 min-w-[320px] items-end gap-0.5 rounded-lg border border-zinc-100 bg-zinc-50 px-1 pb-1 pt-2 sm:h-20 sm:min-w-0"
                role="img"
                aria-label="Uptime by hour for the last 24 hours in your local time"
              >
                {bars.map((pct, i) => (
                  <div
                    key={i}
                    className="flex min-h-0 min-w-0 flex-1 flex-col justify-end rounded-sm bg-zinc-200/60"
                    title={
                      pct < 0
                        ? `${formatLocalHourRangeLabel(windowStartMs, i)}: no checks`
                        : `${formatLocalHourRangeLabel(windowStartMs, i)}: ${pct.toFixed(1)}% up`
                    }
                  >
                    {pct < 0 ? (
                      <div className="h-1 w-full rounded-sm bg-zinc-300" />
                    ) : (
                      <div
                        className={["w-full rounded-sm", barTone(pct)].join(" ")}
                        style={{ height: `${Math.max(6, Math.min(100, pct))}%` }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-zinc-400 sm:text-xs">
              Older → newer (local time)
            </p>
          </>
        )}
      </div>
    </section>
  );
}
