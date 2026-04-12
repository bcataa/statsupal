import type { PublicUptimeWindows } from "@/lib/status/public-uptime";

type Props = {
  uptime: PublicUptimeWindows;
  bars24h: number[];
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

export function PublicUptimeSection({ uptime, bars24h }: Props) {
  const hasHourlyData = bars24h.some((b) => b >= 0);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold text-zinc-900 sm:text-xl">Uptime</h2>
      <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
        Based on automated checks stored for this status page (operational and degraded count as up).
        Times and windows use UTC.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
        {(
          [
            { label: "24 hours", value: uptime.hours24 },
            { label: "7 days", value: uptime.days7 },
            { label: "30 days", value: uptime.days30 },
          ] as const
        ).map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3 text-center sm:px-4"
          >
            <p className="text-xl font-semibold tabular-nums text-zinc-900 sm:text-3xl">
              {item.value.toFixed(2)}%
            </p>
            <p className="mt-1 text-xs text-zinc-500">{item.label}</p>
          </div>
        ))}
      </div>
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
                aria-label="Uptime by hour for the last 24 hours"
              >
                {bars24h.map((pct, i) => (
                  <div
                    key={i}
                    className="flex min-h-0 min-w-0 flex-1 flex-col justify-end rounded-sm bg-zinc-200/60"
                    title={
                      pct < 0
                        ? `Hour ${i + 1}: no checks`
                        : `Hour ${i + 1}: ${pct.toFixed(1)}% up`
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
            <p className="mt-2 text-center text-[10px] text-zinc-400 sm:text-xs">Older → Newer (UTC)</p>
          </>
        )}
      </div>
    </section>
  );
}
