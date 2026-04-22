"use client";

import { MonitorTypeCard } from "@/components/services/add-monitor/MonitorTypeCard";
import { MonitorTypeIcon } from "@/components/services/add-monitor/monitor-type-icons";
import {
  MONITOR_TYPE_DEFS,
  type UIMonitorTypeId,
} from "@/components/services/add-monitor/monitor-type-defs";

type MonitorTypeGridProps = {
  value: UIMonitorTypeId;
  onChange: (id: UIMonitorTypeId) => void;
};

export function MonitorTypeGrid({ value, onChange }: MonitorTypeGridProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
      {MONITOR_TYPE_DEFS.map((def) => (
        <MonitorTypeCard
          key={def.id}
          id={def.id}
          title={def.title}
          description={def.description}
          available={def.available}
          selected={value === def.id}
          onSelect={onChange}
          icon={<MonitorTypeIcon id={def.id} />}
        />
      ))}
    </div>
  );
}
