import type { Incident, Service, UptimeDayPoint, UptimeSummary } from "@/lib/models/monitoring";

export type PublicOverallStatus = "all-operational" | "partial-outage" | "major-outage";

export function getPublicOverallStatus(services: Service[]): PublicOverallStatus {
  if (services.some((s) => s.isPublished && s.status === "down")) {
    return "major-outage";
  }
  if (services.some((s) => s.isPublished && s.status === "degraded")) {
    return "partial-outage";
  }
  return "all-operational";
}

export function headlineForOverall(status: PublicOverallStatus): string {
  if (status === "major-outage") {
    return "Some systems are down";
  }
  if (status === "partial-outage") {
    return "Partially degraded";
  }
  return "All systems operational";
}

export function expandUptimeToBars(
  points: UptimeDayPoint[] | undefined,
  target: number,
): number[] | null {
  if (!points || points.length === 0) {
    return null;
  }
  const raw = points.map((p) =>
    p.uptimePercentage == null ? 0.5 : p.uptimePercentage / 100,
  );
  const out: number[] = [];
  const per = target / raw.length;
  for (let i = 0; i < target; i++) {
    const idx = Math.min(raw.length - 1, Math.floor(i / per));
    out.push(Math.max(0.2, 0.12 + raw[idx] * 0.86));
  }
  return out;
}

export function buildRecentNoticeLines(incidents: Incident[]): { id: string; line1: string; line2: string }[] {
  return [...incidents]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8)
    .map((i) => {
      const d = new Date(i.updatedAt);
      const line1 = Number.isNaN(d.getTime()) ? "Recent" : d.toLocaleDateString(undefined, { dateStyle: "long" });
      return { id: i.id, line1, line2: i.title || "Update" };
    });
}

export function uptimeLabelFromSummary(summary: UptimeSummary, servicesCount: number): string {
  if (servicesCount === 0) {
    return "Add monitors to track uptime";
  }
  if (summary.averageUptimePercentage > 0) {
    return `${summary.averageUptimePercentage.toFixed(1)}% avg uptime (7d)`;
  }
  return "Uptime data building";
}
