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

function lineColor(status: string): string {
  if (status === "operational") return "#34d399";
  if (status === "degraded")    return "#fbbf24";
  if (status === "down")        return "#f87171";
  return "#6b7280";
}

/** Dominant status among the last N points */
function dominantColor(points: Point[]): string {
  if (points.some((p) => p.status === "down"))     return "#f87171";
  if (points.some((p) => p.status === "degraded")) return "#fbbf24";
  if (points.some((p) => p.status === "operational")) return "#34d399";
  return "#6b7280";
}

export function MonitorSparkline({ points, className, maxBars = 48 }: MonitorSparklineProps) {
  const slice = points.slice(-maxBars);

  const W = 120, H = 32;

  if (slice.length === 0) {
    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden
        className={["w-[120px] h-8", className ?? ""].join(" ")}
        preserveAspectRatio="none"
      >
        <line x1="0" y1={H / 2} x2={W} y2={H / 2}
          stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" strokeDasharray="3 3" />
      </svg>
    );
  }

  const cap = Math.max(1, ...slice.map((p) => p.response_time_ms), 200);
  const color = dominantColor(slice);

  // Map each point to an (x, y) coordinate
  const pts: [number, number][] = slice.map((p, i) => {
    const x = (i / Math.max(slice.length - 1, 1)) * W;
    // High response time → tall spike (higher y = lower on screen, so invert)
    const norm = Math.min(p.response_time_ms, cap) / cap;
    const y = H - 4 - norm * (H - 10);
    return [x, y];
  });

  // Build smooth bezier path
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }

  const last = pts[pts.length - 1];
  const fillPath = `${d} L ${last[0]},${H} L ${pts[0][0]},${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden
      className={["w-[120px] h-8", className ?? ""].join(" ")}
      preserveAspectRatio="none"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`spark-fill-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Fill under line */}
      <path d={fillPath} fill={`url(#spark-fill-${color.replace("#","")})`} />

      {/* The ECG line itself */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}88)` }}
      />

      {/* Dot at the latest point */}
      <circle
        cx={last[0]}
        cy={last[1]}
        r="2"
        fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}
