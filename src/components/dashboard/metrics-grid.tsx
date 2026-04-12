import type { DashboardMetric } from "@/lib/models/monitoring";

type MetricsGridProps = {
  metrics: DashboardMetric[];
};

const toneClasses: Record<DashboardMetric["tone"], string> = {
  neutral: "bg-zinc-200",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
};

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-500">{metric.label}</p>
            <span className={`h-2.5 w-2.5 rounded-full ${toneClasses[metric.tone]}`} />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:mt-3 sm:text-3xl">
            {metric.value}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{metric.detail}</p>
        </article>
      ))}
    </section>
  );
}
