"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Service } from "@/lib/models/monitoring";
import { formatDateTime, formatTimestampOrText } from "@/lib/utils/date-time";
import { formatServiceResponse } from "@/lib/utils/monitoring-display";
import { useAppData } from "@/state/app-data-provider";

type StatusPageProps = {
  params: { project: string };
};

type OverallStatus = "all-operational" | "partial-outage" | "major-outage";

function formatProjectName(project: string): string {
  const decoded = decodeURIComponent(project).trim();
  if (!decoded) {
    return "Statsupal";
  }

  return decoded
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getOverallStatus(services: Service[]): OverallStatus {
  if (services.some((service) => service.status === "down")) {
    return "major-outage";
  }
  if (services.some((service) => service.status === "degraded")) {
    return "partial-outage";
  }
  return "all-operational";
}

function getStatusHeadline(status: OverallStatus): string {
  if (status === "major-outage") {
    return "Major Outage";
  }
  if (status === "partial-outage") {
    return "Partial Outage";
  }
  return "All Systems Operational";
}

function getPublicServiceLabel(status: Service["status"]): "Up" | "Degraded" | "Down" {
  if (status === "operational") {
    return "Up";
  }
  if (status === "degraded") {
    return "Degraded";
  }
  return "Down";
}

function getStatusDescription(status: OverallStatus): string {
  if (status === "major-outage") {
    return "Some services are currently having issues. Our team is actively working to restore full service.";
  }
  if (status === "partial-outage") {
    return "A few services are slower than usual or intermittently unavailable. We are monitoring closely.";
  }
  return "Everything is currently operating normally across all monitored services.";
}

function getStatusTone(status: OverallStatus): {
  dotClass: string;
  panelClass: string;
} {
  if (status === "major-outage") {
    return {
      dotClass: "bg-rose-500",
      panelClass: "border-rose-200 bg-rose-50/80 text-rose-900",
    };
  }
  if (status === "partial-outage") {
    return {
      dotClass: "bg-amber-500",
      panelClass: "border-amber-200 bg-amber-50/80 text-amber-900",
    };
  }
  return {
    dotClass: "bg-emerald-500",
    panelClass: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
  };
}

function getLastUpdated(services: Service[]): string {
  const timestamps = [
    ...services.map((service) => service.lastChecked || service.createdAt),
  ].filter(Boolean);

  if (timestamps.length === 0) {
    return new Date().toISOString();
  }

  return timestamps.reduce((latest, current) => (current > latest ? current : latest));
}

export default function StatusPage({ params }: StatusPageProps) {
  const { services, incidents, maintenanceWindows, workspace, refreshData } = useAppData();
  const publishedServices = services.filter((service) => service.isPublished);
  const projectSlug = decodeURIComponent(params.project || "").trim();
  const fallbackSlug = workspace.domainSettings.statusPageSlug || "status";
  const resolvedProjectSlug = projectSlug || fallbackSlug;
  const projectName = formatProjectName(resolvedProjectSlug);
  const overallStatus = getOverallStatus(publishedServices);
  const tone = getStatusTone(overallStatus);
  const lastUpdated = getLastUpdated(publishedServices);
  const operationalCount = publishedServices.filter(
    (service) => service.status === "operational",
  ).length;
  const degradedCount = publishedServices.filter((service) => service.status === "degraded").length;
  const downCount = publishedServices.filter((service) => service.status === "down").length;
  const activeIncidents = incidents
    .filter((incident) => incident.status !== "resolved")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const resolvedIncidents = incidents
    .filter((incident) => incident.status === "resolved")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);
  const serviceNameById = new Map(services.map((service) => [service.id, service.name]));
  const workspaceIntro =
    workspace.publicDescription || "Real-time system status and incident updates.";
  const supportEmail = workspace.notificationSettings.supportEmail;
  const initials = workspace.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  const activeMaintenance = maintenanceWindows.filter(
    (window) => window.status === "active",
  );
  const resolvedMaintenance = maintenanceWindows
    .filter((window) => window.status === "completed" || window.status === "cancelled")
    .slice(0, 6);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onSubscribe = async () => {
    setSubscriptionMessage(null);
    if (!subscriberEmail.trim()) {
      setSubscriptionMessage("Enter an email address first.");
      return;
    }
    try {
      setSubmitting(true);
      const response = await fetch("/api/status/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectSlug: resolvedProjectSlug,
          email: subscriberEmail.trim(),
          incidentCreated: true,
          incidentResolved: true,
          maintenanceAlerts: true,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body?.success) {
        throw new Error(body?.message || "Could not subscribe.");
      }
      setSubscriberEmail("");
      setSubscriptionMessage("Subscribed. You will receive future status alerts.");
    } catch (error) {
      setSubscriptionMessage(error instanceof Error ? error.message : "Could not subscribe.");
    } finally {
      setSubmitting(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <main className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-14">
      <div className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-16 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />

      <div className="relative mx-auto w-full max-w-5xl space-y-8">
        <header className="space-y-4 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 shadow-sm">
            {initials || "SP"}
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {workspace.name}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            {projectName} status
          </h1>
          <p className="mx-auto max-w-2xl text-base text-zinc-600 sm:text-lg">
            {workspaceIntro}
          </p>
          {supportEmail ? (
            <p className="text-xs text-zinc-500">Need help? Contact {supportEmail}</p>
          ) : null}
        </header>

        <section className={`rounded-2xl border p-6 shadow-sm sm:p-8 ${tone.panelClass}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-current/20 bg-white/70 px-3 py-1 text-xs">
                <span className={`h-2.5 w-2.5 rounded-full ${tone.dotClass} animate-pulse`} />
                Live status
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                {getStatusHeadline(overallStatus)}
              </h2>
              <p className="mt-2 text-sm/6 opacity-90">{getStatusDescription(overallStatus)}</p>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-xs opacity-80">Last updated {formatDateTime(lastUpdated)}</p>
                <button
                  type="button"
                  onClick={() => void onRefresh()}
                  disabled={refreshing}
                  className="rounded-full border border-current/20 bg-white/70 px-2 py-0.5 text-[11px] font-medium hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 sm:text-sm">
              <div className="rounded-xl border border-current/20 bg-white/60 px-3 py-2">
                <p className="font-semibold">{operationalCount}</p>
                <p className="opacity-80">Healthy</p>
              </div>
              <div className="rounded-xl border border-current/20 bg-white/60 px-3 py-2">
                <p className="font-semibold">{degradedCount}</p>
                <p className="opacity-80">Slower</p>
              </div>
              <div className="rounded-xl border border-current/20 bg-white/60 px-3 py-2">
                <p className="font-semibold">{downCount}</p>
                <p className="opacity-80">Having issues</p>
              </div>
              <div className="rounded-xl border border-current/20 bg-white/60 px-3 py-2">
                <p className="font-semibold">{activeIncidents.length}</p>
                <p className="opacity-80">Active incidents</p>
              </div>
            </div>
          </div>
        </section>

        {activeIncidents.length > 0 ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {activeIncidents.length} active incident
            {activeIncidents.length > 1 ? "s are" : " is"} currently being handled.
          </p>
        ) : null}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-zinc-900">Maintenance windows</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Planned changes are listed separately from incidents.
          </p>
          {activeMaintenance.length > 0 ? (
            <div className="mt-3 space-y-2">
              {activeMaintenance.map((window) => (
                <article key={window.id} className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
                  <p className="font-medium">{window.title}</p>
                  <p className="text-xs opacity-80">
                    {formatDateTime(window.startsAt)} - {formatDateTime(window.endsAt)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
              No maintenance windows are active right now.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-zinc-900">Services</h2>
            <p className="text-sm text-zinc-500">
              See what is healthy, what is slower than usual, and what is currently impacted.
            </p>
          </div>

          {publishedServices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center">
              <p className="text-sm font-medium text-zinc-700">No public services published yet.</p>
              <p className="mt-1 text-xs text-zinc-500">
                This page will show live status as soon as services are published.
              </p>
              {supportEmail ? (
                <a
                  href={`mailto:${supportEmail}`}
                  className="mt-4 inline-flex rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Contact support
                </a>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {publishedServices.map((service) => (
                <article
                  key={service.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-zinc-900">{service.name}</p>
                      {service.description ? (
                        <p className="mt-1 text-sm text-zinc-600">{service.description}</p>
                      ) : (
                        <p className="mt-1 text-sm text-zinc-500">
                          Core service monitored in real time.
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <StatusBadge value={service.status} />
                      <p className="mt-1 text-xs font-medium text-zinc-600">
                        {getPublicServiceLabel(service.status)}
                      </p>
                    </div>
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

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-zinc-900">Subscribe to alerts</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Get incident and maintenance updates by email.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={subscriberEmail}
              onChange={(event) => setSubscriberEmail(event.target.value)}
              placeholder="you@company.com"
              className="h-10 flex-1 rounded-xl border border-zinc-300 px-3 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            />
            <button
              type="button"
              onClick={() => void onSubscribe()}
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Subscribing..." : "Subscribe"}
            </button>
          </div>
          {subscriptionMessage ? (
            <p className="mt-2 text-xs text-zinc-600">{subscriptionMessage}</p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-zinc-900">Completed maintenance</h2>
          {resolvedMaintenance.length > 0 ? (
            <div className="mt-3 space-y-3">
              {resolvedMaintenance.map((window) => (
                <article key={window.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-sm font-medium text-zinc-900">{window.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatDateTime(window.startsAt)} - {formatDateTime(window.endsAt)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
              No completed maintenance to show yet.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">Incident history</h2>
              <p className="text-sm text-zinc-500">
                Active incidents are listed first, followed by recently resolved updates.
              </p>
            </div>
            <span className="text-xs text-zinc-500">
              {activeIncidents.length} active • {resolvedIncidents.length} resolved
            </span>
          </div>

          {incidents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center">
              <p className="text-sm font-medium text-zinc-700">No incidents reported.</p>
              <p className="mt-1 text-xs text-zinc-500">
                Everything is operating normally right now.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Active incidents
                </p>
                {activeIncidents.length === 0 ? (
                  <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
                    No active incidents.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activeIncidents.map((incident) => (
                      <article
                        key={incident.id}
                        className="rounded-xl border border-rose-200 bg-rose-50/40 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-zinc-900">{incident.title}</p>
                          <div className="flex items-center gap-2">
                            <StatusBadge value={incident.status} />
                            <StatusBadge value={incident.severity} />
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-zinc-600">
                          Affected service:{" "}
                          {serviceNameById.get(incident.affectedServiceId) ?? "Unknown service"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Started {formatDateTime(incident.startedAt)} • Updated{" "}
                          {formatDateTime(incident.updatedAt)}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Resolved incidents
                </p>
                {resolvedIncidents.length === 0 ? (
                  <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
                    No resolved incidents yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {resolvedIncidents.map((incident) => (
                      <article
                        key={incident.id}
                        className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-zinc-900">{incident.title}</p>
                          <StatusBadge value="resolved" />
                        </div>
                        <p className="mt-1 text-xs text-zinc-600">
                          Affected service:{" "}
                          {serviceNameById.get(incident.affectedServiceId) ?? "Unknown service"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Resolved{" "}
                          {incident.resolvedAt
                            ? formatDateTime(incident.resolvedAt)
                            : formatDateTime(incident.updatedAt)}
                        </p>
                        {incident.resolutionSummary ? (
                          <p className="mt-2 text-xs text-zinc-600">{incident.resolutionSummary}</p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
          This page provides live service status and incident communication so you can quickly
          understand if everything is working normally. If an issue appears, our team is already
          aware and updates are posted here.
        </section>

        <footer className="pb-4 text-center text-xs text-zinc-500">
          Powered by {workspace.name || "Statsupal"} • Last refresh {formatDateTime(lastUpdated)}
        </footer>
      </div>
    </main>
  );
}
