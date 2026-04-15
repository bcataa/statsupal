import { signAutomationBody } from "@/lib/automations/sign";
import { logAutomations } from "@/lib/logging/server-log";

const BACKOFF_MS = [0, 1000, 3000, 10_000];

export type DeliveryAttemptResult = {
  attempt: number;
  success: boolean;
  httpStatus: number | null;
  errorMessage: string | null;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST JSON to webhook URL with optional HMAC signature. Retries with backoff when retryEnabled.
 */
export async function deliverAutomationWebhook(params: {
  webhookUrl: string;
  rawBody: string;
  secret: string | null;
  retryEnabled: boolean;
}): Promise<DeliveryAttemptResult[]> {
  const maxAttempts = params.retryEnabled ? 4 : 1;
  const results: DeliveryAttemptResult[] = [];

  for (let i = 0; i < maxAttempts; i++) {
    if (BACKOFF_MS[i]! > 0) {
      await sleep(BACKOFF_MS[i]!);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Statsupal-Automations/1.0",
    };
    if (params.secret) {
      headers["x-statsupal-signature"] = signAutomationBody(params.secret, params.rawBody);
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25_000);
      const res = await fetch(params.webhookUrl, {
        method: "POST",
        headers,
        body: params.rawBody,
        signal: controller.signal,
      });
      clearTimeout(timer);

      const ok = res.ok;
      const httpStatus = res.status;
      const success = ok;
      results.push({
        attempt: i + 1,
        success,
        httpStatus,
        errorMessage: success ? null : `HTTP ${httpStatus}`,
      });

      logAutomations.info("webhook attempt", {
        attempt: i + 1,
        httpStatus,
        success,
      });

      if (success) {
        return results;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({
        attempt: i + 1,
        success: false,
        httpStatus: null,
        errorMessage: msg.slice(0, 500),
      });
      logAutomations.warn("webhook attempt failed", { attempt: i + 1, error: msg });
    }
  }

  return results;
}
