"use client";

import type { UIMonitorTypeId } from "@/components/services/add-monitor/monitor-type-defs";

const common = {
  width: 20,
  height: 20,
  className: "shrink-0" as const,
  "aria-hidden": true as const,
};

/**
 * Consistent 20×20 icons for each monitor type (used in the type dropdown and type grid).
 */
export function MonitorTypeIcon({ id }: { id: UIMonitorTypeId }) {
  switch (id) {
    case "website":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M3 8h18" />
          <circle cx="6" cy="6" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "api":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M8 9h2M8 12h2M8 15h2" strokeLinecap="round" />
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M14 8h5M15 12h3.5" strokeLinecap="round" />
        </svg>
      );
    case "ping":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M4 12a8 8 0 1 0 8-8" strokeLinecap="round" />
          <path d="M2 2 8 8" strokeLinecap="round" />
        </svg>
      );
    case "cron":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 1.5" strokeLinecap="round" />
          <path d="M5 3 2 6M19 3l3 3" strokeLinecap="round" />
        </svg>
      );
    case "tcp":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="M8 10h.01M12 10h.01M16 10h.01" />
        </svg>
      );
    case "udp":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M5 7h5v4H5V7zM16 4l2 2-2 2M14 14h4v4h-4v-4z" strokeLinejoin="round" />
        </svg>
      );
    case "dns":
    default:
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a15 15 0 0 0 0 18M12 3a15 15 0 0 1 0 18" />
        </svg>
      );
  }
}
