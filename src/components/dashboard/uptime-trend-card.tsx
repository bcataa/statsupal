type UptimeTrendItem = {
  day: string;
  value: number;
};

type UptimeTrendCardProps = {
  points: UptimeTrendItem[];
};

function barHeightClass(value: number): string {
  if (value >= 99.98) {
    return "h-20";
  }

  if (value >= 99.95) {
    return "h-16";
  }

  if (value >= 99.9) {
    return "h-12";
  }

  return "h-8";
}

export function UptimeTrendCard({ points }: UptimeTrendCardProps) {
  const avgUptime =
    points.reduce((sum, point) => sum + point.value, 0) / Math.max(points.length, 1);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-900">Weekly Uptime Trend</h2>
        <p className="text-sm text-zinc-500">Average uptime: {avgUptime.toFixed(2)}%</p>
      </div>

      <div className="flex h-28 items-end justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
        {points.map((point) => (
          <div key={point.day} className="flex flex-1 flex-col items-center justify-end gap-2">
            <span
              className={`w-full rounded-md bg-emerald-500/85 ${barHeightClass(point.value)}`}
              title={`${point.day}: ${point.value}%`}
            />
            <span className="text-[11px] font-medium text-zinc-500">{point.day}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
