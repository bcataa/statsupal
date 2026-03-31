import type { Service } from "@/lib/models/monitoring";
import { StatusBadge } from "@/components/ui/status-badge";

type PublicServicesListProps = {
  services: Service[];
};

export function PublicServicesList({ services }: PublicServicesListProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900">Services</h2>
        <p className="text-sm text-zinc-500">Current availability across all monitored services.</p>
      </div>

      {services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center">
          <p className="text-sm font-medium text-zinc-700">No services are currently configured.</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
          {services.map((service) => (
            <article
              key={service.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="font-medium text-zinc-900">{service.name}</p>
                {service.description && <p className="mt-1 text-sm text-zinc-600">{service.description}</p>}
              </div>
              <StatusBadge value={service.status} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
