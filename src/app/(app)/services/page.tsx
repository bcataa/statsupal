"use client";

import { AddServiceButton } from "@/components/services/add-service-button";
import { ServicesTable } from "@/components/services/services-table";
import { useAppData } from "@/state/app-data-provider";

export default function ServicesPage() {
  const { services, isHydrated } = useAppData();

  if (!isHydrated) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200" />
          <div className="mt-4 h-4 w-full max-w-md animate-pulse rounded bg-zinc-100" />
        </section>
        <section className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 p-10">
          <div className="mx-auto max-w-md space-y-3">
            <div className="mx-auto h-6 w-40 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
            <div className="h-4 max-w-sm animate-pulse rounded bg-zinc-100" />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Services</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Add each website or API you want to watch. This is the main action in Statsupal—without a
              service, checks do not run.
            </p>
          </div>
          <AddServiceButton />
        </div>
      </section>

      {services.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-zinc-300 bg-gradient-to-b from-white to-zinc-50/80 p-10 text-center shadow-sm">
          <p className="text-3xl" aria-hidden>
            ◇
          </p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900">Add your first service</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            Use <strong className="font-medium text-zinc-700">Add service</strong> and enter a URL (for
            example your API or website). We will start HTTP checks on the schedule you choose. You can
            hide a service from the public page anytime.
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
