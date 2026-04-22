"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MonitorDetailView } from "@/components/monitors/monitor-detail-view";
import { useAppData } from "@/state/app-data-provider";

type HistoryPoint = {
  status: string;
  response_time_ms: number;
  checked_at: string;
};

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = typeof params?.serviceId === "string" ? params.serviceId : "";
  const { services, isHydrated } = useAppData();
  const service = services.find((s) => s.id === serviceId) ?? null;
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) {
      return;
    }
    let cancel = false;
    void (async () => {
      try {
        const res = await fetch(`/api/monitor/history/${encodeURIComponent(serviceId)}`);
        if (!res.ok) {
          throw new Error("Failed to load");
        }
        const data = (await res.json()) as { points?: HistoryPoint[] };
        if (!cancel) {
          setPoints(data.points ?? []);
          setLoadError(null);
        }
      } catch {
        if (!cancel) {
          setLoadError("Could not load check history.");
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, [serviceId]);

  if (!isHydrated) {
    return (
      <div className="mx-auto w-full max-w-5xl py-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-800" />
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-zinc-900" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-zinc-900/50 p-8 text-center">
        <h2 className="text-lg font-semibold text-zinc-200">Monitor not found</h2>
        <p className="mt-2 text-sm text-zinc-500">It may have been deleted, or the link is invalid.</p>
        <button
          type="button"
          onClick={() => router.push("/services")}
          className="mt-4 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200"
        >
          Back to monitors
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl py-2">
      {loadError ? (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {loadError}
        </p>
      ) : null}
      <MonitorDetailView service={service} initialPoints={points} />
    </div>
  );
}
