import Link from "next/link";
import { PublicIncidentHistory } from "@/components/status/public-incident-history";
import { PublicStatusPremiumView } from "@/components/status/public-status-premium-view";
import { PublicUptimeSection } from "@/components/status/public-uptime-section";
import { LocalDateTime, LocalTimestampOrText } from "@/components/ui/local-datetime";
import { StatusBadge } from "@/components/ui/status-badge";
import { logApi } from "@/lib/logging/server-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicSupportEmail, getPublicSupportMailto } from "@/lib/support/contact-info";
import type { Incident, Service } from "@/lib/models/monitoring";
import {
  loadPublicUptimeBars24h,
  loadPublicWorkspaceUptime,
} from "@/lib/status/public-uptime";
import { formatServiceResponse } from "@/lib/utils/monitoring-display";

type OverallStatus = "all-operational" | "partial-outage" | "major-outage";

type WorkspaceRow = {
  id: string;
  name: string;
  project_name: string | null;
  public_description: string | null;
  support_email: string | null;
  brand_color: string | null;
  operational_color: string | null;
  brand_logo_url: string | null;
  brand_favicon_url: string | null;
  status_page_published: boolean | null;
  status_page_style: string | null;
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

function getLastUpdated(services: Service[]): string | null {
  const timestamps = services.map((s) => s.lastChecked || s.createdAt).filter(Boolean);
  if (timestamps.length === 0) {
    return null;
  }
  return timestamps.reduce((latest, current) => (current > latest ? current : latest));
}

type IncidentDbRow = {
  id: string;
  title: string;
  description: string | null;
  source: string | null;
  affected_service_id: string;
  status: Incident["status"];
  severity: Incident["severity"];
  started_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolution_summary: string | null;
};

function mapIncidentRow(row: IncidentDbRow): Incident {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    source: (row.source as Incident["source"]) ?? "manual",
    affectedServiceId: row.affected_service_id,
    status: row.status,
    severity: row.severity,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at ?? undefined,
    resolutionSummary: row.resolution_summary ?? undefined,
  };
}

function StatusUnpublished({ slugLabel }: { slugLabel: string }) {
  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white sm:px-6">
      <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 text-center shadow-2xl">
        <h1 className="text-xl font-semibold tracking-tight">This page isn’t public yet</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          The status page
          {slugLabel ? (
            <>
              {" "}
              <code className="text-cyan-300">{slugLabel}</code>
            </>
          ) : null}{" "}
          hasn’t been published. Ask your team to enable publishing in Statsupal, or check back later.
        </p>
        <p className="mt-6 text-xs text-zinc-600">
          <Link href="/" className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
            Back to Statsupal
          </Link>
        </p>
      </div>
    </main>
  );
}

function StatusNotFound({ slugLabel }: { slugLabel: string }) {
  return (
    <main className="px-4 py-16 sm:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Status page not found</h1>
        <p className="mt-2 text-sm text-zinc-600">
          We couldn&apos;t find a public status page
          {slugLabel ? (
            <>
              {" "}
              for <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-800">{slugLabel}</code>
            </>
          ) : (
            " for that link"
          )}
          . Check the page address or confirm your project slug under Settings.
        </p>
      </div>
    </main>
  );
}

type PublicStatusViewProps = {
  projectParam: string;
};

export async function PublicStatusView({ projectParam }: PublicStatusViewProps) {
  const resolvedProjectSlug = decodeURIComponent(projectParam || "").trim();

  if (!resolvedProjectSlug) {
    return <StatusNotFound slugLabel="" />;
  }

  const admin = createAdminClient() as SupabaseAdmin;

  const workspaceResult = await admin
    .from("workspaces")
    .select(
      "id,name,project_name,public_description,support_email,brand_color,operational_color,brand_logo_url,brand_favicon_url,status_page_published,status_page_style",
    )
    .eq("project_slug", resolvedProjectSlug)
    .maybeSingle();

  if (workspaceResult.error || !workspaceResult.data) {
    return <StatusNotFound slugLabel={resolvedProjectSlug} />;
  }

  const workspace = workspaceResult.data as WorkspaceRow;

  if (workspace.status_page_published === false) {
    return <StatusUnpublished slugLabel={resolvedProjectSlug} />;
  }
  const servicesResult = await admin
    .from("services")
    .select("id,name,description,status,is_published,last_checked,response_time_ms,created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  const serviceRows = (servicesResult.data ?? []) as ServiceRow[];

  const incidentsResult = await (
    admin as unknown as {
      from: (t: string) => {
        select: (s: string) => {
          eq: (a: string, b: string) => {
            order: (c: string, o: { ascending: boolean }) => {
              limit: (n: number) => Promise<{ data: unknown; error: unknown }>;
            };
          };
        };
      };
    }
  )
    .from("incidents")
    .select(
      "id,title,description,source,affected_service_id,status,severity,started_at,updated_at,resolved_at,resolution_summary",
    )
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false })
    .limit(40);

  const incidentModels: Incident[] = incidentsResult.error
    ? []
    : ((incidentsResult.data ?? []) as IncidentDbRow[]).map(mapIncidentRow);

  const serviceLabels = serviceRows.map((r) => ({ id: r.id, name: r.name }));

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

  logApi.info("public status page loaded", {
    workspaceId: workspace.id,
    projectSlug: resolvedProjectSlug,
    servicesLoaded: publishedServices.length,
  });

  const overallStatus = getOverallStatus(publishedServices);
  const operationalCount = publishedServices.filter((s) => s.status === "operational").length;
  const degradedCount = publishedServices.filter((s) => s.status === "degraded").length;
  const downCount = publishedServices.filter((s) => s.status === "down").length;
  const lastUpdated = getLastUpdated(publishedServices);

  const publishedIds = publishedServices.map((s) => s.id);
  const [uptime, bars24h] = await Promise.all([
    loadPublicWorkspaceUptime(admin, workspace.id, publishedIds),
    loadPublicUptimeBars24h(admin, publishedIds),
  ]);

  if (workspace.status_page_style === "premium_dark") {
    return (
      <PublicStatusPremiumView
        workspace={{
          name: workspace.name,
          project_name: workspace.project_name,
          public_description: workspace.public_description,
          support_email: workspace.support_email,
          brand_color: workspace.brand_color,
          operational_color: workspace.operational_color,
          brand_logo_url: workspace.brand_logo_url,
          brand_favicon_url: workspace.brand_favicon_url,
        }}
        projectSlug={resolvedProjectSlug}
        publishedServices={publishedServices}
        incidents={incidentModels}
        serviceLabels={serviceLabels}
        overallStatus={overallStatus}
        lastUpdated={lastUpdated}
        uptime={uptime}
        bars24h={bars24h}
      />
    );
  }

  return (
    <main className="min-w-0 overflow-x-hidden px-3 py-8 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-5xl space-y-6 sm:space-y-8">
        <header className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 sm:text-xs">
            {workspace.name}
          </p>
          <p className="mt-1 text-[10px] font-medium text-violet-600 sm:text-[11px]">
            Powered by Statsupal
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
            Status page
          </h1>
          <p className="mt-2 px-1 text-sm text-zinc-600 sm:px-0">
            {workspace.public_description || "Real-time system status and incident updates."}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {lastUpdated ? (
              <>
                Last updated <LocalDateTime iso={lastUpdated} />
              </>
            ) : (
              <>Publish services to show live check timestamps.</>
            )}
          </p>
        </header>

        <section
          className={`rounded-2xl border p-4 shadow-sm sm:p-8 ${getStatusTone(overallStatus)}`}
        >
          <h2 className="text-xl font-semibold tracking-tight sm:text-3xl">
            {getStatusHeadline(overallStatus)}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4 sm:text-sm">
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

        {publishedServices.length > 0 ? (
          <PublicUptimeSection uptime={uptime} bars24h={bars24h} />
        ) : null}

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-zinc-900 sm:text-xl">Services</h2>
          {publishedServices.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center">
              <p className="text-sm font-medium text-zinc-700">No public services published yet</p>
              <p className="mt-1 text-xs text-zinc-500">
                This page will show live status once services are published.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
              {publishedServices.map((service) => (
                <article
                  key={service.id}
                  className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-base font-semibold text-zinc-900">{service.name}</p>
                      {service.description ? (
                        <p className="mt-1 text-sm text-zinc-600">{service.description}</p>
                      ) : null}
                    </div>
                    <StatusBadge value={service.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-zinc-600 sm:grid-cols-2">
                    <p className="min-w-0 break-words">
                      Last checked:{" "}
                      {service.lastChecked ? (
                        <LocalTimestampOrText value={service.lastChecked} />
                      ) : (
                        "Unknown"
                      )}
                    </p>
                    <p className="min-w-0 break-words">
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

        <PublicIncidentHistory incidents={incidentModels} services={serviceLabels} />

        <footer className="border-t border-zinc-200 pt-6 pb-4 text-center text-[11px] text-zinc-500 sm:text-xs">
          {workspace.support_email ? (
            <p>
              Contact this team:{" "}
              <a
                className="font-medium text-violet-700 underline underline-offset-2"
                href={`mailto:${workspace.support_email}`}
              >
                {workspace.support_email}
              </a>
            </p>
          ) : null}
          <p
            className={[
              "flex flex-wrap items-center justify-center gap-x-2 gap-y-1",
              workspace.support_email ? "mt-3" : "",
            ].join(" ")}
          >
            <span className="text-zinc-600">Statsupal</span>
            <span className="hidden sm:inline">·</span>
            <a className="text-violet-700 underline underline-offset-2" href={getPublicSupportMailto()}>
              {getPublicSupportEmail()}
            </a>
            <span className="hidden sm:inline">·</span>
            <Link href="/privacy" className="text-zinc-600 hover:text-zinc-900">
              Privacy
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link href="/terms" className="text-zinc-600 hover:text-zinc-900">
              Terms
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
