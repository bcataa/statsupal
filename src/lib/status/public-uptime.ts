import type { ServiceStatus } from "@/lib/models/monitoring";

export type PublicUptimeWindows = {
  hours24: number;
  days7: number;
  days30: number;
};

type HistoryRow = {
  status: ServiceStatus;
  checked_at: string;
};

type AdminLike = {
  from: (table: string) => {
    select: (...args: unknown[]) => {
      in: (...args: unknown[]) => {
        gte: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
      };
    };
  };
};

function healthy(status: ServiceStatus): boolean {
  return status === "operational" || status === "degraded";
}

function computeUptime(rows: HistoryRow[]): number {
  if (rows.length === 0) {
    return 100;
  }
  const ok = rows.filter((r) => healthy(r.status)).length;
  return Math.round((ok / rows.length) * 10000) / 100;
}

export async function loadPublicWorkspaceUptime(
  admin: unknown,
  workspaceId: string,
  serviceIds: string[],
): Promise<PublicUptimeWindows> {
  if (serviceIds.length === 0) {
    return { hours24: 100, days7: 100, days30: 100 };
  }

  const db = admin as AdminLike;
  const now = Date.now();
  const since30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const result = await db
    .from("service_check_history")
    .select("status,checked_at")
    .in("service_id", serviceIds)
    .gte("checked_at", since30);

  if (result.error) {
    return { hours24: 100, days7: 100, days30: 100 };
  }

  const rows = (result.data ?? []) as HistoryRow[];
  const cutoff24 = now - 24 * 60 * 60 * 1000;
  const cutoff7 = now - 7 * 24 * 60 * 60 * 1000;
  const cutoff30 = now - 30 * 24 * 60 * 60 * 1000;

  const r24 = rows.filter((r) => new Date(r.checked_at).getTime() >= cutoff24);
  const r7 = rows.filter((r) => new Date(r.checked_at).getTime() >= cutoff7);
  const r30 = rows.filter((r) => new Date(r.checked_at).getTime() >= cutoff30);

  return {
    hours24: computeUptime(r24),
    days7: computeUptime(r7),
    days30: computeUptime(r30),
  };
}

/** One value per hour for the last 24h: 0–100 uptime %, or -1 if no checks in that hour. */
export async function loadPublicUptimeBars24h(
  admin: unknown,
  serviceIds: string[],
): Promise<number[]> {
  const empty = () => Array.from({ length: 24 }, () => -1);
  if (serviceIds.length === 0) {
    return empty();
  }

  const db = admin as AdminLike;
  const now = Date.now();
  const windowStart = now - 24 * 60 * 60 * 1000;
  const since = new Date(windowStart).toISOString();

  const result = await db
    .from("service_check_history")
    .select("status,checked_at")
    .in("service_id", serviceIds)
    .gte("checked_at", since);

  if (result.error) {
    return empty();
  }

  const rows = (result.data ?? []) as HistoryRow[];
  const buckets: HistoryRow[][] = Array.from({ length: 24 }, () => []);

  for (const row of rows) {
    const t = new Date(row.checked_at).getTime();
    if (t < windowStart || t > now) {
      continue;
    }
    const hourIndex = Math.min(23, Math.floor((t - windowStart) / (60 * 60 * 1000)));
    buckets[hourIndex]?.push(row);
  }

  return buckets.map((list) => (list.length === 0 ? -1 : computeUptime(list)));
}
