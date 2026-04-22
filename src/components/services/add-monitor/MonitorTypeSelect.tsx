"use client";

import { MonitorTypeIcon } from "@/components/services/add-monitor/monitor-type-icons";
import {
  getDefById,
  MONITOR_TYPE_DEFS,
  type UIMonitorTypeId,
} from "@/components/services/add-monitor/monitor-type-defs";

const BDR = "rgba(255,255,255,0.08)";

type MonitorTypeSelectProps = {
  value: UIMonitorTypeId;
  onChange: (id: UIMonitorTypeId) => void;
  id: string;
};

/**
 * Single-row monitor type control (icon + label + chevron) matching premium status UIs.
 */
export function MonitorTypeSelect({ value, onChange, id }: MonitorTypeSelectProps) {
  const def = getDefById(value);
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute top-1/2 left-3 z-[1] -translate-y-1/2"
        style={{ color: def.id === "website" ? "rgb(56, 189, 248)" : "rgb(161, 161, 170)" }}
      >
        <MonitorTypeIcon id={value} />
      </div>
      <label htmlFor={id} className="sr-only">
        Monitor type
      </label>
      <select
        id={id}
        value={value}
        disabled={!def.available}
        onChange={(e) => onChange(e.target.value as UIMonitorTypeId)}
        className="h-[52px] w-full cursor-pointer appearance-none rounded-xl border pl-12 pr-10 text-left text-sm font-medium text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/35 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          backgroundColor: "#0a0a0a",
          borderColor: BDR,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.75rem center",
          backgroundSize: "1rem",
        }}
      >
        {MONITOR_TYPE_DEFS.map((d) => (
          <option key={d.id} value={d.id} disabled={!d.available}>
            {d.title}
            {!d.available ? " (soon)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
