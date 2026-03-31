import type { Service } from "@/lib/models/monitoring";

type OverallStatus = "all-operational" | "partial-outage" | "major-outage";

type OverallStatusBannerProps = {
  status: OverallStatus;
  serviceCount: number;
  hasActiveMajorOrCriticalIncident?: boolean;
};

const styleByStatus: Record<
  OverallStatus,
  { title: string; subtitle: string; classes: string; dotClass: string }
> = {
  "all-operational": {
    title: "All Systems Operational",
    subtitle: "All monitored services are currently healthy.",
    classes: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
    dotClass: "bg-emerald-500",
  },
  "partial-outage": {
    title: "Partial Outage",
    subtitle: "One or more services are degraded. Teams are actively investigating.",
    classes: "border-amber-200 bg-amber-50/80 text-amber-900",
    dotClass: "bg-amber-500",
  },
  "major-outage": {
    title: "Major Outage",
    subtitle: "Critical disruptions detected. Restoration work is in progress.",
    classes: "border-rose-200 bg-rose-50/80 text-rose-900",
    dotClass: "bg-rose-500",
  },
};

export function getOverallStatus(services: Service[]): OverallStatus {
  if (services.some((service) => service.status === "down")) {
    return "major-outage";
  }

  if (services.some((service) => service.status === "degraded")) {
    return "partial-outage";
  }

  return "all-operational";
}

export function OverallStatusBanner({
  status,
  serviceCount,
  hasActiveMajorOrCriticalIncident = false,
}: OverallStatusBannerProps) {
  const ui = styleByStatus[status];

  return (
    <section
      className={[
        `rounded-2xl border p-6 shadow-sm sm:p-8 ${ui.classes}`,
        hasActiveMajorOrCriticalIncident ? "ring-1 ring-rose-200" : "",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`mt-1 h-3 w-3 rounded-full ${ui.dotClass}`} />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{ui.title}</h2>
            <p className="mt-1 text-sm/6 opacity-90">{ui.subtitle}</p>
          </div>
        </div>
        <p className="rounded-full border border-current/20 px-3 py-1 text-xs font-medium opacity-80">
          {serviceCount} monitored services
        </p>
      </div>
      {hasActiveMajorOrCriticalIncident && (
        <p className="mt-3 text-xs font-medium text-rose-700">
          Active major/critical incidents are currently being addressed.
        </p>
      )}
    </section>
  );
}
