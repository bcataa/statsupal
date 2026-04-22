"use client";

type Point = {
  status: string;
  response_time_ms: number;
};

type MonitorSparklineProps = {
  points: Point[];
  className?: string;
  maxBars?: number;
};

function barColor(status: string): string {
  if (status === "operational") {
    return "bg-emerald-400/90";
  }
  if (status === "degraded") {
    return "bg-amber-400/90";
  }
  if (status === "down") {
    return "bg-rose-500/90";
  }
  return "bg-zinc-600/80";
}

function barHeightMs(ms: number, cap: number): string {
  const t = cap > 0 ? Math.min(1, ms / cap) : 0.5;
  const h = 20 + t * 80;
  return `${Math.round(h)}%`;
}

export function MonitorSparkline({ points, className, maxBars = 48 }: MonitorSparklineProps) {
  const slice = points.slice(-maxBars);
  if (slice.length === 0) {
    return (
      <div
        className={[
          "flex h-8 w-[120px] items-end gap-px rounded-md border border-white/5 bg-zinc-900/50 px-0.5 py-0.5",
          className ?? "",
        ].join(" ")}
        aria-hidden
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="w-1 flex-1 rounded-sm bg-zinc-700/50"
            style={{ height: "35%" }}
          />
        ))}
      </div>
    );
  }

  const cap = Math.max(
    1,
    ...slice.map((p) => p.response_time_ms),
    200,
  );

  return (
    <div
      className={[
        "flex h-8 w-[min(100%,8rem)] min-w-[7rem] items-end justify-stretch gap-px rounded-md border border-cyan-500/15 bg-zinc-950/80 px-0.5 py-0.5 shadow-[inset_0_0_12px_rgba(0,0,0,0.4)]",
        className ?? "",
      ].join(" ")}
      title="Check history (recent window)"
    >
      {slice.map((p, i) => (
        <span
          key={`${p.status}-${i}`}
          className={[
            "w-0.5 min-w-0 flex-1 rounded-[1px] transition-colors",
            barColor(p.status),
          ].join(" ")}
          style={{ height: barHeightMs(p.response_time_ms, cap) }}
        />
      ))}
    </div>
  );
}
