import type { ServiceStatus } from "@/lib/models/monitoring";

const DEFAULT_TIMEOUT_MS = 5000;
const DEGRADED_THRESHOLD_MS = 2000;

export type MonitoringResult = {
  status: ServiceStatus;
  responseTimeMs: number;
  lastChecked: string;
};

export async function runHttpCheck(
  url: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<MonitoringResult> {
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const nowIso = new Date().toISOString();

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    const responseTimeMs = Math.max(1, Math.round(performance.now() - startedAt));
    const isSuccessful = response.status >= 200 && response.status < 400;

    if (!isSuccessful) {
      const result: MonitoringResult = {
        status: "down",
        responseTimeMs,
        lastChecked: nowIso,
      };
      console.info("[monitor] raw-result", {
        url,
        httpStatus: response.status,
        ok: response.ok,
        mappedStatus: result.status,
        responseTimeMs: result.responseTimeMs,
      });
      return result;
    }

    const status: ServiceStatus =
      responseTimeMs > DEGRADED_THRESHOLD_MS ? "degraded" : "operational";
    const result: MonitoringResult = {
      status,
      responseTimeMs,
      lastChecked: nowIso,
    };
    console.info("[monitor] raw-result", {
      url,
      httpStatus: response.status,
      ok: response.ok,
      mappedStatus: result.status,
      responseTimeMs: result.responseTimeMs,
    });
    return result;
  } catch (error) {
    const result: MonitoringResult = {
      status: "down",
      responseTimeMs: 0,
      lastChecked: nowIso,
    };
    console.warn("[monitor] raw-result", {
      url,
      mappedStatus: result.status,
      responseTimeMs: result.responseTimeMs,
      reason:
        error instanceof DOMException && error.name === "AbortError"
          ? "timeout"
          : "request_failed_or_blocked",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}
