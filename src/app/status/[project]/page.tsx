import { StatusBadge } from "@/components/ui/status-badge";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Service } from "@/lib/models/monitoring";
import { formatDateTime, formatTimestampOrText } from "@/lib/utils/date-time";
import { formatServiceResponse } from "@/lib/utils/monitoring-display";

type StatusPageProps = {
  params: { project: string };
};

type OverallStatus = "all-operational" | "partial-outage" | "major-outage";

type WorkspaceRow = {
  id: string;
  name: string;
  public_description: string | null;
  support_email: string | null;
};

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  status: Service["status"];
  is_published: boolean | null;
  last_checked: string;
  response_time_ms: number;
  created_at: string;
};

type SupabaseAdmin = {
  from: (table: string) => {
    select: (...args: unknown[]) => {
      eq: (...args: unknown[]) => {
        maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
        order: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
      };
      order: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
    };
  };
};

function getOverallStatus(services: Service[]): OverallStatus {
  if (services.some((service) => service.status === "down")) return "major-outage";
  if (services.some((service) => service.status === "degraded")) return "partial-outage";
  return "all-operational";
}

function getStatusHeadline(status: OverallStatus): string {
  if (status === "major-outage") return "Major Outage";
  if (status === "partial-outage") return "Partial Outage";
  return "All Systems Operational";
}

function getStatusTone(status: OverallStatus): string {
  if (status === "major-outage") return "border-rose-200 bg-rose-50/80 text-rose-900";
  if (status === "partial-outage") return "border-amber-200 bg-amber-50/80 text-amber-900";
  return "border-emerald-200 bg-emerald-50/80 text-emerald-900";
}

function getLastUpdated(services: Service[]): string {
  const timestamps = services.map((s) => s.lastChecked || s.createdAt).filter(Boolean);
  return timestamps.length === 0
    ? new Date().toISOString()
    : timestamps.reduce((latest, current) => (current > latest ? current : latest));
}

export default async function StatusPage({ params }: StatusPageProps) {
  const resolvedProjectSlug = decodeURIComponent(params.project || "").trim();
  const admin = createAdminClient() as SupabaseAdmin;

  const workspaceResult = await admin
    .from("workspaces")
    .select("id,name,public_description,support_email")
    .eq("project_slug", resolvedProjectSlug)
    .maybeSingle();

  if (workspaceResult.error || !workspaceResult.data) {
    return (
      <main className="px-4 py-16 sm:px-6">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-zinc-900">Status page not found</h1>
          <p className="mt-2 text-sm text-zinc-600">
            We couldn&apos;t find a public status page for <code>{resolvedProjectSlug}</code>.
          </p>
        </div>
      </main>
    );
  }

  const workspace = workspaceResult.data as WorkspaceRow;
  const servicesResult = await admin
    .from("services")
    .select("id,name,description,status,is_published,last_checked,response_time_ms,created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  const serviceRows = (servicesResult.data ?? []) as ServiceRow[];
  const publishedServices = serviceRows
    .map((row) => ({ ...row, is_published: row.is_published ?? true }))
    .filter((row) => row.is_published === true)
    .map((row) => ({
      id: row.id,
      name: row.name,
      url: "",
      description: row.description || undefined,
      status: row.status,
      isPublished: true,
      timeoutMs: 10000,
      failureThreshold: 3,
      retryCount: 0,
      checkType: "http" as const,
      checkInterval: "1 min",
      lastChecked: row.last_checked,
      responseTimeMs: row.response_time_ms,
      createdAt: row.created_at,
    }));

  console.info("[status-public] workspace found", {
    workspaceId: workspace.id,
    projectSlug: resolvedProjectSlug,
  });
  console.info("[status-public] services loaded", {
    projectSlug: resolvedProjectSlug,
    servicesLoaded: publishedServices.length,
  });

  const overallStatus = getOverallStatus(publishedServices);
  const operationalCount = publishedServices.filter((s) => s.status === "operational").length;
  const degradedCount = publishedServices.filter((s) => s.status === "degraded").length;
  const downCount = publishedServices.filter((s) => s.status === "down").length;
  const lastUpdated = getLastUpdated(publishedServices);

  return (
    <main className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {workspace.name}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            Status Page
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {workspace.public_description || "Real-time system status and incident updates."}
          </p>
          <p className="mt-2 text-xs text-zinc-500">Last updated {formatDateTime(lastUpdated)}</p>
        </header>

        <section className={`rounded-2xl border p-6 shadow-sm sm:p-8 ${getStatusTone(overallStatus)}`}>
          <h2 className="text-3xl font-semibold tracking-tight">{getStatusHeadline(overallStatus)}</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 sm:text-sm">
            <div className="rounded-xl border border-current/20 bg-white/60 px-3 py-2">
              <p className="font-semibold">{operationalCount}</p>
              <p className="opacity-80">Up</p>
            </div>
            <div className="rounded-xl border border-current/20 bg-white/60 px-3 py-2">
              <p className="font-semibold">{degradedCount}</p>
              <p className="opacity-80">Degraded</p>
            </div>
            <div className="rounded-xl border border-current/20 bg-white/60 px-3 py-2">
              <p className="font-semibold">{downCount}</p>
              <p className="opacity-80">Down</p>
            </div>
            <div className="rounded-xl border border-current/20 bg-white/60 px-3 py-2">
              <p className="font-semibold">{downCount + degradedCount}</p>
              <p className="opacity-80">Active incidents</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-zinc-900">Services</h2>
          {publishedServices.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center">
              <p className="text-sm font-medium text-zinc-700">No public services published yet</p>
              <p className="mt-1 text-xs text-zinc-500">
                This page will show live status once services are published.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {publishedServices.map((service) => (
                <article key={service.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-zinc-900">{service.name}</p>
                      {service.description ? (
                        <p className="mt-1 text-sm text-zinc-600">{service.description}</p>
                      ) : null}
                    </div>
                    <StatusBadge value={service.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-600">
                    <p>Last checked: {formatTimestampOrText(service.lastChecked || "Unknown")}</p>
                    <p>
                      Response:{" "}
                      {formatServiceResponse({
                        status: service.status,
                        responseTimeMs: service.responseTimeMs,
                        lastChecked: service.lastChecked,
                      })}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {workspace.support_email ? (
          <footer className="pb-4 text-center text-xs text-zinc-500">
            Need help? {workspace.support_email}
          </footer>
        ) : null}
      </div>
    </main>
  );
}
