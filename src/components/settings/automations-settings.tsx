"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils/date-time";

type TriggerType = "service_down" | "incident_created" | "incident_resolved";

type RuleRow = {
  id: string;
  name: string;
  trigger_type: TriggerType;
  webhook_url: string;
  secret: string | null;
  hasSecret?: boolean;
  cooldown_minutes: number;
  enabled: boolean;
  retry_enabled: boolean;
  last_triggered_at: string | null;
  last_delivery_status: string | null;
  last_http_status: number | null;
  last_error: string | null;
  created_at: string;
};

type LogRow = {
  id: string;
  event_type: string;
  attempt_number: number;
  success: boolean;
  http_status: number | null;
  error_message: string | null;
  created_at: string;
};

const TRIGGER_LABELS: Record<TriggerType, string> = {
  service_down: "Service goes down (after failure threshold)",
  incident_created: "Incident created",
  incident_resolved: "Incident resolved",
};

export function AutomationsSettings() {
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>("service_down");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [cooldownMinutes, setCooldownMinutes] = useState(5);
  const [enabled, setEnabled] = useState(true);
  const [retryEnabled, setRetryEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [logsFor, setLogsFor] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/automations/rules", { credentials: "include" });
      const data = (await res.json()) as { success?: boolean; rules?: RuleRow[]; message?: string };
      if (!res.ok || !data.success) {
        setError(data.message ?? "Could not load automations.");
        setRules([]);
        return;
      }
      setRules(data.rules ?? []);
    } catch {
      setError("Could not load automations.");
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const loadLogs = async (ruleId: string) => {
    setLogsLoading(true);
    setLogs([]);
    try {
      const res = await fetch(
        `/api/automations/rules/${encodeURIComponent(ruleId)}/logs?limit=40`,
        { credentials: "include" },
      );
      const data = (await res.json()) as { success?: boolean; logs?: LogRow[] };
      if (res.ok && data.success) {
        setLogs(data.logs ?? []);
      }
    } finally {
      setLogsLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setTestMessage(null);
    try {
      const res = await fetch("/api/automations/rules", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Automation",
          trigger_type: triggerType,
          webhook_url: webhookUrl.trim(),
          secret: secret.trim() || null,
          cooldown_minutes: cooldownMinutes,
          enabled,
          retry_enabled: retryEnabled,
        }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) {
        setError(data.message ?? "Could not save.");
        return;
      }
      setName("");
      setWebhookUrl("");
      setSecret("");
      await loadRules();
    } catch {
      setError("Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const onTest = async (id: string) => {
    setTestingId(id);
    setTestMessage(null);
    try {
      const res = await fetch(`/api/automations/rules/${encodeURIComponent(id)}/test`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      setTestMessage(data.message ?? (data.success ? "Sent." : "Failed."));
      await loadRules();
    } catch {
      setTestMessage("Request failed.");
    } finally {
      setTestingId(null);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Delete this automation rule?")) {
      return;
    }
    try {
      const res = await fetch(`/api/automations/rules/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { success?: boolean };
      if (res.ok && data.success) {
        await loadRules();
      }
    } catch {
      setError("Could not delete.");
    }
  };

  const toggleExpandLogs = async (id: string) => {
    if (logsFor === id) {
      setLogsFor(null);
      return;
    }
    setLogsFor(id);
    await loadLogs(id);
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-zinc-900">Automations</h3>
      <p className="mt-1 text-sm text-zinc-600">
        Statsupal does <strong>not</strong> restart your servers or run shell commands. We only send{" "}
        <strong>HTTP POST</strong> webhooks to a URL you control. Your own small service (restart agent) can
        verify the signature and run <code className="rounded bg-zinc-100 px-1 text-xs">pm2</code>,{" "}
        <code className="rounded bg-zinc-100 px-1 text-xs">docker</code>, etc. on the machine where it runs.
      </p>
      <p className="mt-2 text-sm">
        <span className="text-zinc-600">
          Point your webhook at a small service you host that validates the request and restarts your process.
        </span>
      </p>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      ) : null}
      {testMessage ? (
        <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
          {testMessage}
        </div>
      ) : null}

      <form className="mt-6 space-y-4 border-t border-zinc-100 pt-6" onSubmit={onSubmit}>
        <p className="text-sm font-medium text-zinc-800">New automation</p>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Label</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Restart API on outage"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            maxLength={120}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">When to send</label>
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value as TriggerType)}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
          >
            {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map((t) => (
              <option key={t} value={t}>
                {TRIGGER_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Webhook URL</label>
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-server.example.com/statsupal-webhook"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Secret (optional, HMAC SHA-256)
          </label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Shared secret for x-statsupal-signature"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            autoComplete="new-password"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Cooldown (minutes)</label>
            <input
              type="number"
              min={1}
              max={1440}
              value={cooldownMinutes}
              onChange={(e) => setCooldownMinutes(Number(e.target.value) || 5)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            />
            <p className="mt-1 text-xs text-zinc-500">Skips repeat sends for this rule until cooldown ends.</p>
          </div>
          <div className="flex flex-col justify-end gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300"
              />
              Enabled
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={retryEnabled}
                onChange={(e) => setRetryEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300"
              />
              Retry on failure (up to 4 attempts, backoff)
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving || !webhookUrl.trim()}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Add automation"}
        </button>
      </form>

      <div className="mt-8 border-t border-zinc-100 pt-6">
        <p className="text-sm font-medium text-zinc-800">Your rules</p>
        {loading ? (
          <p className="mt-3 text-sm text-zinc-500">Loading…</p>
        ) : rules.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No automations yet.</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {rules.map((r) => (
              <li key={r.id} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900">{r.name}</p>
                    <p className="text-xs text-violet-700">{TRIGGER_LABELS[r.trigger_type]}</p>
                    <p className="mt-1 break-all font-mono text-xs text-zinc-600">{r.webhook_url}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      Last sent:{" "}
                      {r.last_triggered_at ? formatDateTime(r.last_triggered_at) : "—"} · Status:{" "}
                      <span
                        className={
                          r.last_delivery_status === "success"
                            ? "text-emerald-700"
                            : r.last_delivery_status === "failed"
                              ? "text-rose-700"
                              : "text-zinc-500"
                        }
                      >
                        {r.last_delivery_status ?? "—"}
                      </span>
                      {r.last_http_status != null ? ` · HTTP ${r.last_http_status}` : ""}
                    </p>
                    {r.last_error ? (
                      <p className="mt-1 text-xs text-rose-600">{r.last_error}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void onTest(r.id)}
                      disabled={testingId === r.id}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
                    >
                      {testingId === r.id ? "Testing…" : "Test webhook"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleExpandLogs(r.id)}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                    >
                      {logsFor === r.id ? "Hide logs" : "Delivery logs"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(r.id)}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-800 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {logsFor === r.id ? (
                  <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-3">
                    {logsLoading ? (
                      <p className="text-xs text-zinc-500">Loading logs…</p>
                    ) : logs.length === 0 ? (
                      <p className="text-xs text-zinc-500">No delivery attempts logged yet.</p>
                    ) : (
                      <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
                        {logs.map((l) => (
                          <li key={l.id} className="flex flex-wrap gap-2 border-b border-zinc-100 py-1">
                            <span className="text-zinc-500">{formatDateTime(l.created_at)}</span>
                            <span className={l.success ? "text-emerald-700" : "text-rose-700"}>
                              {l.success ? "ok" : "fail"}
                            </span>
                            <span className="text-zinc-600">#{l.attempt_number}</span>
                            {l.http_status != null ? <span>HTTP {l.http_status}</span> : null}
                            {l.error_message ? (
                              <span className="text-rose-600">{l.error_message}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
