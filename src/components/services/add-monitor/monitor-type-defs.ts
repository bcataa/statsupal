import type { CheckType } from "@/lib/models/monitoring";
import type { MonitorTestMonitorKind } from "@/lib/monitoring/monitor-test-kinds";

export type UIMonitorTypeId = "website" | "api" | "ping" | "cron" | "tcp" | "udp" | "dns";

export type MonitorTypeDef = {
  id: UIMonitorTypeId;
  title: string;
  description: string;
  /** If false, card is not selectable (backend or roadmap). */
  available: boolean;
  /** Maps to existing monitoring check. */
  checkType: CheckType;
  /** Kind sent to POST /api/monitor/test. */
  testKind: MonitorTestMonitorKind;
};

export const MONITOR_TYPE_DEFS: MonitorTypeDef[] = [
  {
    id: "website",
    title: "Website",
    description: "Check HTTP/HTTPS availability",
    available: true,
    checkType: "http",
    testKind: "website",
  },
  {
    id: "api",
    title: "API",
    description: "Validate endpoints & responses",
    available: true,
    checkType: "http",
    testKind: "website",
  },
  {
    id: "ping",
    title: "Ping",
    description: "Basic uptime (HTTP GET)",
    available: true,
    checkType: "ping",
    testKind: "ping",
  },
  {
    id: "cron",
    title: "Cron",
    description: "Expect periodic pings (coming soon)",
    available: false,
    checkType: "http",
    testKind: "cron",
  },
  {
    id: "tcp",
    title: "TCP",
    description: "Check open ports",
    available: false,
    checkType: "http",
    testKind: "tcp",
  },
  {
    id: "udp",
    title: "UDP",
    description: "Check UDP services",
    available: false,
    checkType: "http",
    testKind: "udp",
  },
  {
    id: "dns",
    title: "DNS",
    description: "Verify DNS resolution",
    available: false,
    checkType: "http",
    testKind: "dns",
  },
];

export function getDefById(id: UIMonitorTypeId): MonitorTypeDef {
  return MONITOR_TYPE_DEFS.find((d) => d.id === id) ?? MONITOR_TYPE_DEFS[0];
}
