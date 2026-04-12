type UptimeTrendItem = {
  day: string;
  uptimePercentage: number;
};

type UptimeTrendCardProps = {
  points: UptimeTrendItem[];
};

function barHeightClass(uptimePercentage: number): string {
  if (uptimePercentage >= 99.98) {
    return "h-20";
  }

  if (uptimePercentage >= 99.95) {
    return "h-16";
  }

  if (uptimePercentage >= 99.9) {
    return "h-12";
  }

  return "h-8";
}

export function UptimeTrendCard({ points }: UptimeTrendCardProps) {
  const avgUptime =
    points.reduce((sum, point) => sum + point.uptimePercentage, 0) / Math.max(points.length, 1);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-3 sm:mb-4">
        <h2 className="text-base font-semibold text-zinc-900">Weekly uptime trend</h2>
        <p className="text-xs text-zinc-500 sm:text-sm">Average uptime (UTC days): {avgUptime.toFixed(2)}%</p>
      </div>

      <div className="overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
        <div className="flex h-28 min-w-[280px] items-end justify-between gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-3 sm:min-w-0 sm:gap-2 sm:px-3">
        {points.map((point) => (
          <div key={point.day} className="flex flex-1 flex-col items-center justify-end gap-2">
            <span
              className={`w-full rounded-md bg-emerald-500/85 ${barHeightClass(point.uptimePercentage)}`}
              title={`${point.day}: ${point.uptimePercentage}%`}
            />
            <span className="text-[11px] font-medium text-zinc-500">{point.day}</span>
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}
