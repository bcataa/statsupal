import type {
  IncidentSeverity,
  IncidentStatus,
  ServiceStatus,
} from "@/lib/models/monitoring";

type StatusBadgeProps = {
  value: ServiceStatus | IncidentStatus | IncidentSeverity;
};

const colorByValue: Record<StatusBadgeProps["value"], string> = {
  pending: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  operational: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  degraded: "bg-amber-50 text-amber-700 ring-amber-200",
  down: "bg-rose-50 text-rose-700 ring-rose-200",
  investigating: "bg-amber-50 text-amber-700 ring-amber-200",
  identified: "bg-orange-50 text-orange-700 ring-orange-200",
  monitoring: "bg-sky-50 text-sky-700 ring-sky-200",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  minor: "bg-amber-50 text-amber-700 ring-amber-200",
  major: "bg-orange-50 text-orange-700 ring-orange-200",
  critical: "bg-rose-50 text-rose-700 ring-rose-200",
};

function formatLabel(value: StatusBadgeProps["value"]): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function StatusBadge({ value }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${colorByValue[value]}`}
    >
      {formatLabel(value)}
    </span>
  );
}
