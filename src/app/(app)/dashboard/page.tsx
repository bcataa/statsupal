"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { IncidentsSummarySection } from "@/components/dashboard/incidents-summary-section";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { PerformanceSummaryCard } from "@/components/dashboard/performance-summary-card";
import { ServicesHealthSection } from "@/components/dashboard/services-health-section";
import { UptimeTrendCard } from "@/components/dashboard/uptime-trend-card";
import type { DashboardMetric } from "@/lib/models/monitoring";
import { useAppData } from "@/state/app-data-provider";

export default function OverviewPage() {
  const { services, incidents, maintenanceWindows, workspace, currentProject, uptimeSummary } =
    useAppData();
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
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <DashboardHeader
        workspaceName={workspace.name}
        projectName={currentProject?.name ?? "Main Project"}
      />

      <MetricsGrid metrics={dashboardMetrics} />

      <section className="grid gap-6 xl:grid-cols-3">
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
          />
        </div>
      </section>
    </div>
  );
}
