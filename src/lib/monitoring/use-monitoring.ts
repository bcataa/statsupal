"use client";

import { useEffect, useRef } from "react";
import { runHttpCheck } from "@/lib/monitoring/monitor";
import type { Incident, IncidentStatus, Service } from "@/lib/models/monitoring";

type UseMonitoringArgs = {
  enabled?: boolean;
  services: Service[];
  incidents: Incident[];
  updateServiceStatus: (
    serviceId: string,
    payload: { status: Service["status"]; responseTimeMs: number; lastChecked: string },
  ) => void;
  createIncident: (payload: {
    title: string;
    description?: string;
    source?: "manual" | "monitoring";
    affectedServiceId: string;
    severity: "major";
    status: IncidentStatus;
  }) => void;
  resolveIncident: (incidentId: string, resolutionSummary?: string) => void;
};

const CHECK_INTERVAL_MS = 60_000;

export function useMonitoring({
  enabled = true,
  services,
  incidents,
  updateServiceStatus,
  createIncident,
  resolveIncident,
}: UseMonitoringArgs) {
  const servicesRef = useRef(services);
  const incidentsRef = useRef(incidents);

  useEffect(() => {
    servicesRef.current = services;
  }, [services]);

  useEffect(() => {
    incidentsRef.current = incidents;
  }, [incidents]);

  useEffect(() => {
    if (!enabled) {
      console.log("MONITORING DISABLED");
      return;
    }

    let cancelled = false;
    console.log("MONITORING STARTED");
    console.log("[monitor] monitoring started", {
      servicesCount: servicesRef.current.length,
      startedAt: new Date().toISOString(),
    });

    const runChecks = async () => {
      console.log("CHECKING SERVICES:", servicesRef.current.length);

      if (servicesRef.current.length === 0) {
        return;
      }

      for (const service of servicesRef.current) {
        if (cancelled) {
          return;
        }

        const previousStatus = service.status;
        const result = await runHttpCheck(service.url);
        console.log("[monitor] result", {
          serviceId: service.id,
          status: result.status,
          responseTimeMs: result.responseTimeMs,
          lastChecked: result.lastChecked,
        });
        console.log("[monitor] service checked", {
          serviceId: service.id,
          url: service.url,
          previousStatus,
          nextStatus: result.status,
          responseTimeMs: result.responseTimeMs,
          lastChecked: result.lastChecked,
        });

        updateServiceStatus(service.id, {
          status: result.status,
          responseTimeMs: result.responseTimeMs,
          lastChecked: result.lastChecked,
        });

        const activeIncident = incidentsRef.current.find(
          (incident) =>
            incident.affectedServiceId === service.id &&
            incident.status !== "resolved",
        );

        if (previousStatus !== "down" && result.status === "down" && !activeIncident) {
          createIncident({
            title: `${service.name} is down`,
            description: `Automated monitor failed to reach ${service.url}.`,
            source: "monitoring",
            affectedServiceId: service.id,
            severity: "major",
            status: "investigating",
          });
          continue;
        }

        if (previousStatus === "down" && result.status === "operational" && activeIncident) {
          resolveIncident(
            activeIncident.id,
            `Auto-resolved after successful monitor check (${result.responseTimeMs} ms).`,
          );
        }
      }
    };

    void runChecks();
    const intervalId = setInterval(() => {
      void runChecks();
    }, CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [
    createIncident,
    enabled,
    resolveIncident,
    services.length,
    updateServiceStatus,
  ]);
}
