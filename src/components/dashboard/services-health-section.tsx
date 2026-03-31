import type { Service } from "@/lib/models/monitoring";
import { formatServiceResponse } from "@/lib/utils/monitoring-display";
import { formatTimestampOrText } from "@/lib/utils/date-time";
import { StatusBadge } from "@/components/ui/status-badge";

type ServicesHealthSectionProps = {
  services: Service[];
};

export function ServicesHealthSection({ services }: ServicesHealthSectionProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Services Health</h2>
          <p className="text-sm text-zinc-500">
            Live check summaries across your monitored endpoints.
          </p>
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">URL</th>
              <th className="px-4 py-3 font-medium">Last Checked</th>
              <th className="px-4 py-3 font-medium">Response</th>
              <th className="px-4 py-3 font-medium">Interval</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-t border-zinc-100">
                <td className="px-4 py-3 font-medium text-zinc-900">{service.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge value={service.status} />
                </td>
                <td className="px-4 py-3 text-zinc-600">{service.url}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatTimestampOrText(service.lastChecked)}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatServiceResponse({
                    status: service.status,
                    responseTimeMs: service.responseTimeMs,
                    lastChecked: service.lastChecked,
                  })}
                </td>
                <td className="px-4 py-3 text-zinc-600">{service.checkInterval}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {services.map((service) => (
          <article key={service.id} className="rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-zinc-900">{service.name}</p>
              <StatusBadge value={service.status} />
            </div>
            <p className="mt-2 text-sm text-zinc-500">{service.url}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-zinc-600">
              <p>Checked: {formatTimestampOrText(service.lastChecked)}</p>
              <p>
                Response:{" "}
                {formatServiceResponse({
                  status: service.status,
                  responseTimeMs: service.responseTimeMs,
                  lastChecked: service.lastChecked,
                })}
              </p>
              <p>Interval: {service.checkInterval}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
