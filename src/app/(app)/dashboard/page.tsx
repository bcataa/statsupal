"use client";

import Link from "next/link";
import { AddServiceButton } from "@/components/services/add-service-button";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { IncidentsSummarySection } from "@/components/dashboard/incidents-summary-section";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { PerformanceSummaryCard } from "@/components/dashboard/performance-summary-card";
import { ServicesHealthSection } from "@/components/dashboard/services-health-section";
import { UptimeTrendCard } from "@/components/dashboard/uptime-trend-card";
import type { DashboardMetric } from "@/lib/models/monitoring";
import { useAppData } from "@/state/app-data-provider";

export default function OverviewPage() {
  const {
    services,
    incidents,
    maintenanceWindows,
    workspace,
    currentProject,
    uptimeSummary,
  } = useAppData();
  const operationalCount = services.filter((service) => service.status === "operational").length;
  const degradedCount = services.filter((service) => service.status === "degraded").length;
  const activeIncidentCount = incidents.filter(
    (incident) => incident.status !== "resolved",
  ).length;
  const resolvedIncidentCount = incidents.filter(
    (incident) => incident.status === "resolved",
  ).length;
  const activeMaintenanceCount = maintenanceWindows.filter(
    (window) => window.status === "active",
  ).length;
  const isFirstRun = services.length === 0;
  const setupIncomplete = workspace.statusPage.onboardingWizardStep < 6;

  const dashboardMetrics: DashboardMetric[] = [
    {
      label: "Total Services",
      value: String(services.length),
      detail: "Monitored endpoints",
      tone: "neutral",
    },
    {
      label: "Operational",
      value: String(operationalCount),
      detail: `${services.length > 0 ? ((operationalCount / services.length) * 100).toFixed(1) : "0.0"}% healthy`,
      tone: "success",
    },
    {
      label: "Degraded",
      value: String(degradedCount),
      detail: degradedCount > 0 ? "Requires attention" : "No degraded services",
      tone: "warning",
    },
    {
      label: "Active Incidents",
      value: String(activeIncidentCount),
      detail:
        activeIncidentCount > 0
          ? `${resolvedIncidentCount} resolved recently`
          : "No open incidents",
      tone: "danger",
    },
    {
      label: "Maintenance",
      value: String(activeMaintenanceCount),
      detail: activeMaintenanceCount > 0 ? "Planned windows live" : "No active maintenance",
      tone: "neutral",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-6">
      <DashboardHeader
        workspaceName={workspace.name}
        projectName={currentProject?.name ?? "Main Project"}
        showCreateIncidentButton={!isFirstRun}
      />

      {setupIncomplete ? (
        <section className="rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-zinc-900 to-zinc-950 px-4 py-4 shadow-sm sm:px-5 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Setup in progress</p>
              <p className="mt-1 text-sm text-zinc-400">
                Pick up the guided flow anytime—connect a monitor, publish your page, and customize how
                it looks.
              </p>
            </div>
            <Link
              href="/onboarding/wizard"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-900"
            >
              Continue setup
            </Link>
          </div>
        </section>
      ) : null}

      {isFirstRun ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
            Welcome
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
            Add a service to start monitoring
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Open <strong className="font-medium text-zinc-800">Add service</strong> and paste the URL you
            want to watch. Notifications, your public status page, and maintenance windows can be tuned
            anytime in Settings.
          </p>
          <div className="mt-6">
            <AddServiceButton />
          </div>
        </section>
      ) : (
        <>
          <MetricsGrid metrics={dashboardMetrics} />

          <section className="grid gap-4 sm:gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <ServicesHealthSection services={services} />
              <IncidentsSummarySection incidents={incidents} services={services} />
            </div>
            <div className="space-y-6">
              <UptimeTrendCard points={uptimeSummary.points} />
              <PerformanceSummaryCard
                services={services}
                resolvedIncidents={resolvedIncidentCount}
                averageResponseTimeMs={uptimeSummary.averageResponseTimeMs}
                averageUptimePercentage={uptimeSummary.averageUptimePercentage}
                hasCheckHistory={uptimeSummary.hasCheckHistory}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
