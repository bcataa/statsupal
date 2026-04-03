import type { Service } from "@/lib/models/monitoring";

type PerformanceSummaryCardProps = {
  services: Service[];
  resolvedIncidents: number;
  averageResponseTimeMs: number;
  averageUptimePercentage: number;
};

export function PerformanceSummaryCard({
  services,
  resolvedIncidents,
  averageResponseTimeMs,
  averageUptimePercentage,
}: PerformanceSummaryCardProps) {
  const measuredServices = services.filter((service) => service.responseTimeMs > 0);
  const avgResponse =
    measuredServices.length > 0
      ? Math.round(
          measuredServices.reduce((sum, service) => sum + service.responseTimeMs, 0) /
            measuredServices.length,
        )
      : 0;

  const slowServices = services.filter((service) => service.responseTimeMs >= 800).length;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-zinc-900">Performance Summary</h2>
      <p className="mt-2 text-sm text-zinc-500">
        A compact view of response speed and incident recovery.
      </p>

      <div className="mt-4 space-y-2 text-sm text-zinc-700">
        <p className="rounded-lg bg-zinc-50 px-3 py-2">
          Average response time:{" "}
          {averageResponseTimeMs > 0
            ? `${averageResponseTimeMs} ms`
            : avgResponse > 0
              ? `${avgResponse} ms`
              : "No data yet"}
        </p>
        <p className="rounded-lg bg-zinc-50 px-3 py-2">
          7-day uptime: {averageUptimePercentage.toFixed(2)}%
        </p>
        <p className="rounded-lg bg-zinc-50 px-3 py-2">Slow services (&gt;=800 ms): {slowServices}</p>
        <p className="rounded-lg bg-zinc-50 px-3 py-2">Resolved incidents: {resolvedIncidents}</p>
      </div>
    </section>
  );
}
