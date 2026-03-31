"use client";

import { useMemo } from "react";
import { PublicIncidentHistory } from "@/components/status/public-incident-history";
import {
  getOverallStatus,
  OverallStatusBanner,
} from "@/components/status/overall-status-banner";
import { PublicServicesList } from "@/components/status/public-services-list";
import { PublicStatusHeader } from "@/components/status/public-status-header";
import { useAppData } from "@/state/app-data-provider";

type PublicStatusPageProps = {
  project: string;
};

function formatProjectName(project: string): string {
  const decoded = decodeURIComponent(project || "demo").trim();
  if (!decoded) {
    return "Statsupal";
  }

  return decoded
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function relativeUpdatedText(isoDate: string): string {
  const time = new Date(isoDate).getTime();

  if (Number.isNaN(time)) {
    return "Last updated recently";
  }

  const deltaMinutes = Math.max(0, Math.floor((Date.now() - time) / 60000));

  if (deltaMinutes < 1) {
    return "Updated just now";
  }

  if (deltaMinutes === 1) {
    return "Updated 1 minute ago";
  }

  if (deltaMinutes < 60) {
    return `Updated ${deltaMinutes} minutes ago`;
  }

  const hours = Math.floor(deltaMinutes / 60);
  return `Updated ${hours} hour${hours === 1 ? "" : "s"} ago`;
}

export function PublicStatusPage({ project }: PublicStatusPageProps) {
  const { services, incidents } = useAppData();
  const projectName = formatProjectName(project);
  const overallStatus = getOverallStatus(services);
  const hasActiveMajorOrCriticalIncident = incidents.some(
    (incident) =>
      incident.status !== "resolved" &&
      (incident.severity === "major" || incident.severity === "critical"),
  );

  const sortedServices = useMemo(
    () =>
      [...services].sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      }),
    [services],
  );

  const lastUpdatedAt = useMemo(() => {
    if (services.length === 0) {
      return new Date().toISOString();
    }

    return services.reduce((latest, service) => {
      return service.createdAt > latest ? service.createdAt : latest;
    }, services[0].createdAt);
  }, [services]);

  return (
    <div className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <PublicStatusHeader
          projectName={projectName}
          updatedText={relativeUpdatedText(lastUpdatedAt)}
        />

        <OverallStatusBanner
          status={overallStatus}
          serviceCount={services.length}
          hasActiveMajorOrCriticalIncident={hasActiveMajorOrCriticalIncident}
        />

        <div className="space-y-6">
          <PublicServicesList services={sortedServices} />
          <PublicIncidentHistory incidents={incidents} services={services} />
        </div>

        <footer className="pt-2 text-center text-xs text-zinc-500">
          Powered by Statsupal
        </footer>
      </div>
    </div>
  );
}
