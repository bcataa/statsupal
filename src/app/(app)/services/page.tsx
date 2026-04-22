"use client";

import { Suspense } from "react";
import { MonitorsDashboard } from "@/components/monitors/monitors-dashboard";
import { useAppData } from "@/state/app-data-provider";

function MonitorsContent() {
  const { services, isHydrated } = useAppData();

  if (!isHydrated) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <div className="h-10 w-56 animate-pulse rounded-lg bg-zinc-800" />
        <div className="h-64 animate-pulse rounded-2xl border border-white/5 bg-zinc-900/50" />
      </div>
    );
  }

  return <MonitorsDashboard services={services} />;
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-5xl">
          <div className="h-64 animate-pulse rounded-2xl bg-zinc-900/50" />
        </div>
      }
    >
      <MonitorsContent />
    </Suspense>
  );
}
