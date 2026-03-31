import type { Service } from "@/lib/models/monitoring";

export function formatServiceResponse({
  status,
  responseTimeMs,
  lastChecked,
}: {
  status: Service["status"];
  responseTimeMs: number;
  lastChecked: string;
}): string {
  const hasNeverChecked = !lastChecked || lastChecked.trim().length === 0;

  if (status === "pending" || hasNeverChecked) {
    return "Awaiting first check";
  }

  if (responseTimeMs > 0) {
    return `${responseTimeMs} ms`;
  }

  if (status === "down") {
    return "Unavailable";
  }

  return "Unavailable";
}
