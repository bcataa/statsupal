"use client";

import { AddServiceButton } from "@/components/services/add-service-button";
import { ServicesTable } from "@/components/services/services-table";
import { useAppData } from "@/state/app-data-provider";

export default function ServicesPage() {
  const { services } = useAppData();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Services</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Manage service checks, monitor intervals, and endpoint health in one place.
            </p>
          </div>
          <AddServiceButton />
        </div>
      </section>

      {services.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900">No services yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            Start by adding your first monitored endpoint. Service checks will appear here
            as soon as they are created.
          </p>
          <div className="mt-6 flex justify-center">
            <AddServiceButton />
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {services.length} service{services.length === 1 ? "" : "s"} configured
            </p>
          </div>
          <ServicesTable services={services} />
        </section>
      )}
    </div>
  );
}
