import type { ServiceStatus } from "@/lib/models/monitoring";

const DEFAULT_TIMEOUT_MS = 10000;
const DEGRADED_THRESHOLD_MS = 2000;

export type MonitoringResult = {
  status: ServiceStatus;
  responseTimeMs: number;
  lastChecked: string;
  httpStatus?: number;
  errorReason?: string;
  responseHeaders?: Record<string, string>;
};

export async function runHttpCheck(
  url: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<MonitoringResult> {
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const nowIso = new Date().toISOString();
  const headers: Record<string, string> = {
    Accept: "*/*",
  };

  // User-Agent header can only be set server-side.
  if (typeof window === "undefined") {
    headers["User-Agent"] = "Mozilla/5.0";
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers,
      redirect: "follow",
    });
    const responseTimeMs = Math.max(1, Math.round(performance.now() - startedAt));
    const isSuccessful = response.status >= 200 && response.status < 400;
    const responseHeaders = Object.fromEntries(response.headers.entries());

    if (!isSuccessful) {
      const result: MonitoringResult = {
        status: "down",
        responseTimeMs,
        lastChecked: nowIso,
        httpStatus: response.status,
        responseHeaders,
        errorReason: "non_success_http_status",
      };
      console.info("[monitor] raw-result", {
        url,
        httpStatus: response.status,
        ok: response.ok,
        mappedStatus: result.status,
        responseTimeMs: result.responseTimeMs,
        errorReason: result.errorReason,
        responseHeaders: result.responseHeaders,
      });
      return result;
    }

    const status: ServiceStatus =
      responseTimeMs > DEGRADED_THRESHOLD_MS ? "degraded" : "operational";
    const result: MonitoringResult = {
      status,
      responseTimeMs,
      lastChecked: nowIso,
      httpStatus: response.status,
      responseHeaders,
    };
    console.info("[monitor] raw-result", {
      url,
      httpStatus: response.status,
      ok: response.ok,
      mappedStatus: result.status,
      responseTimeMs: result.responseTimeMs,
      responseHeaders: result.responseHeaders,
    });
    return result;
  } catch (error) {
    const errorReason =
      error instanceof DOMException && error.name === "AbortError"
        ? "timeout"
        : "request_failed_or_blocked";
    const result: MonitoringResult = {
      status: "down",
      responseTimeMs: 0,
      lastChecked: nowIso,
      errorReason,
    };
    console.warn("[monitor] raw-result", {
      url,
      mappedStatus: result.status,
      responseTimeMs: result.responseTimeMs,
      reason: errorReason,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}
