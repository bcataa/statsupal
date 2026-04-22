"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useAppData } from "@/state/app-data-provider";
import type { CheckType } from "@/lib/models/monitoring";
import { getSupabaseErrorDetails } from "@/lib/supabase/app-data";
import { MonitorTypeSelect } from "@/components/services/add-monitor/MonitorTypeSelect";
import { MonitorTestInput, type TestRunState } from "@/components/services/add-monitor/MonitorTestInput";
import {
  getDefById,
  type UIMonitorTypeId,
} from "@/components/services/add-monitor/monitor-type-defs";

const BDR = "rgba(255, 255, 255, 0.1)";
const INNER = "rgba(10, 10, 10, 0.85)";

const SUCCESS_MODES = [{ value: "available", label: "URL is available" }] as const;

type FormState = {
  monitorTypeId: UIMonitorTypeId;
  url: string;
  successMode: (typeof SUCCESS_MODES)[number]["value"];
  displayName: string;
  checkInterval: string;
  timeoutMs: number;
  failureThreshold: number;
  retryCount: number;
  description: string;
};

const defaultState = (): FormState => ({
  monitorTypeId: "website",
  url: "",
  successMode: "available",
  displayName: "",
  checkInterval: "1 min",
  timeoutMs: 10000,
  failureThreshold: 3,
  retryCount: 0,
  description: "",
});

function defaultNameFromUrl(url: string): string {
  try {
    const u = new URL(url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`);
    return u.hostname || "New monitor";
  } catch {
    return "New monitor";
  }
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.url.trim()) {
    errors.url = "URL is required.";
  } else {
    const raw = form.url.trim();
    const candidate = raw.startsWith("http") ? raw : `https://${raw}`;
    try {
      new URL(candidate);
    } catch {
      errors.url = "Enter a valid URL or hostname.";
    }
  }
  if (!form.checkInterval.trim()) {
    errors.checkInterval = "Interval is required.";
  }
  if (form.timeoutMs < 1000) {
    errors.timeoutMs = "At least 1000 ms.";
  }
  return errors;
}

export function AddMonitorModal() {
  const { isAddServiceModalOpen, closeAddServiceModal, addService } = useAppData();
  const [form, setForm] = useState<FormState>(defaultState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [testState, setTestState] = useState<TestRunState>({ status: "idle" });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [alertsRowOpen, setAlertsRowOpen] = useState(false);
  const [headerTab, setHeaderTab] = useState<"monitors" | "alerts">("monitors");
  const inputRef = useRef<HTMLInputElement>(null);
  const typeSelectId = useId();

  const handleClose = useCallback(() => {
    setForm(defaultState());
    setErrors({});
    setSubmitError(null);
    setTestState({ status: "idle" });
    setAdvancedOpen(false);
    setAlertsRowOpen(false);
    setHeaderTab("monitors");
    closeAddServiceModal();
  }, [closeAddServiceModal]);

  const resetForm = useCallback(() => {
    setForm(defaultState());
    setErrors({});
    setSubmitError(null);
    setTestState({ status: "idle" });
  }, []);

  useEffect(() => {
    if (isAddServiceModalOpen) {
      resetForm();
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isAddServiceModalOpen, resetForm]);

  useEffect(() => {
    if (!isAddServiceModalOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isAddServiceModalOpen, handleClose]);

  const runTest = useCallback(async () => {
    const t = form.url.trim();
    if (!t) {
      setTestState({ status: "error", message: "Enter a URL to test." });
      return;
    }
    setTestState({ status: "loading" });
    try {
      const res = await fetch("/api/monitor/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          url: t,
          monitorKind: getDefById(form.monitorTypeId).testKind,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        responseTimeMs?: number;
      };
      if (data.ok) {
        setTestState({
          status: "success",
          message: data.message ?? "Reachable",
          ms: data.responseTimeMs,
        });
      } else {
        setTestState({
          status: "error",
          message: data.message ?? "Check failed. Try again or verify the URL.",
        });
      }
    } catch {
      setTestState({ status: "error", message: "Network error. Try again." });
    }
  }, [form.url, form.monitorTypeId]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = getDefById(form.monitorTypeId);
    if (!d.available) {
      setSubmitError("This monitor type is not available yet.");
      return;
    }
    const validation = validateForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      return;
    }
    const d0 = getDefById(form.monitorTypeId);
    const checkType: CheckType = d0.checkType === "api" ? "http" : d0.checkType;
    const name = form.displayName.trim() || defaultNameFromUrl(form.url);
    const urlNormalized = (() => {
      const u = form.url.trim();
      if (/^https?:\/\//i.test(u)) {
        return u;
      }
      return `https://${u}`;
    })();
    try {
      setIsSaving(true);
      setSubmitError(null);
      await addService({
        name,
        url: urlNormalized,
        checkType,
        checkInterval: form.checkInterval.trim(),
        timeoutMs: form.timeoutMs,
        failureThreshold: form.failureThreshold,
        retryCount: form.retryCount,
        description: form.description.trim() || undefined,
      });
      handleClose();
    } catch (error) {
      const details = getSupabaseErrorDetails(error);
      setSubmitError(
        [details.message || "Could not create monitor.", details.hint ? `Hint: ${details.hint}` : ""]
          .filter(Boolean)
          .join(" "),
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAddServiceModalOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={handleClose}
        aria-label="Close add monitor"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-monitor-header"
        className="relative z-10 w-full max-w-[560px] overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: "#000000",
          borderColor: BDR,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 32px 80px -24px rgba(0,0,0,0.9)",
        }}
      >
        <header
          className="flex items-center justify-between gap-3 border-b px-4 py-3.5 sm:px-5"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setHeaderTab("monitors")}
              className={[
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                headerTab === "monitors"
                  ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-100 shadow-[0_0_20px_-8px_rgba(99,102,241,0.45)]"
                  : "border-transparent text-zinc-500 hover:text-zinc-300",
              ].join(" ")}
            >
              Monitors
            </button>
            <button
              type="button"
              onClick={() => setHeaderTab("alerts")}
              className={[
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                headerTab === "alerts"
                  ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-100 shadow-[0_0_20px_-8px_rgba(99,102,241,0.45)]"
                  : "border-transparent text-zinc-500 hover:text-zinc-300",
              ].join(" ")}
            >
              Alerts
            </button>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="group inline-flex items-center gap-2.5 text-sm text-zinc-400 transition hover:text-zinc-200"
          >
            <span>Close</span>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition group-hover:bg-zinc-200"
              aria-hidden
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </span>
          </button>
        </header>

        {headerTab === "alerts" ? (
          <div className="px-5 py-8 text-center sm:px-6">
            <h2 className="text-sm font-medium text-zinc-200" id="add-monitor-header">
              Alert delivery
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Route and escalation rules for this monitor will land here. For now, configure
              channel routing under{" "}
              <Link
                className="text-indigo-400 underline decoration-indigo-500/40 underline-offset-2 hover:text-indigo-300"
                href="/settings"
                onClick={handleClose}
              >
                Settings
              </Link>{" "}
              → Notifications.
            </p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="max-h-[min(88vh,820px)] overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5"
            aria-describedby={submitError ? "add-mon-err" : undefined}
          >
            <h2 id="add-monitor-header" className="sr-only">
              Add monitor
            </h2>
            <div
              className="space-y-5 rounded-2xl border p-4 sm:p-5"
              style={{ borderColor: "rgba(255,255,255,0.08)", background: INNER }}
            >
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">Monitor type</p>
                <MonitorTypeSelect
                  id={typeSelectId}
                  value={form.monitorTypeId}
                  onChange={(id) => {
                    setForm((f) => ({ ...f, monitorTypeId: id }));
                    setTestState({ status: "idle" });
                  }}
                />
              </div>

              <div>
                <MonitorTestInput
                  url={form.url}
                  onUrlChange={(url) => {
                    setForm((f) => ({ ...f, url }));
                    if (testState.status !== "idle") {
                      setTestState({ status: "idle" });
                    }
                  }}
                  onRun={runTest}
                  testState={testState}
                  inputRef={inputRef}
                />
                {errors.url ? <p className="mt-1.5 text-xs text-rose-400">{errors.url}</p> : null}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-500">Monitor is successful if</span>
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-sm text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
                    title="More success rules coming soon"
                    disabled
                    aria-label="Add condition (coming soon)"
                  >
                    +
                  </button>
                </div>
                <label htmlFor="am-success" className="sr-only">
                  Success condition
                </label>
                <select
                  id="am-success"
                  value={form.successMode}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      successMode: e.target.value as FormState["successMode"],
                    }))
                  }
                  className="h-[52px] w-full cursor-pointer appearance-none rounded-xl border bg-[#0a0a0a] pr-9 pl-3 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/35"
                  style={{
                    borderColor: "rgba(255,255,255,0.08)",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1rem",
                  }}
                >
                  {SUCCESS_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-white/10 pt-1">
                <button
                  type="button"
                  onClick={() => setAlertsRowOpen((s) => !s)}
                  className="flex w-full items-center justify-between gap-2 py-2.5 text-left text-sm text-zinc-200 transition hover:text-white"
                >
                  <span>Alerts</span>
                  <span className="text-xs text-zinc-500 tabular-nums">
                    1 / 1 <span className="ml-0.5 text-zinc-500">&gt;</span>
                  </span>
                </button>
                {alertsRowOpen ? (
                  <p className="mb-1 rounded-lg border border-indigo-500/15 bg-indigo-500/5 px-2.5 py-2.5 text-xs text-zinc-400">
                    Per-recipient rules will be configurable here. Connect email and other channels
                    in{" "}
                    <Link
                      className="text-indigo-400 underline-offset-2 hover:underline"
                      href="/settings"
                      onClick={handleClose}
                    >
                      notification settings
                    </Link>
                    .
                  </p>
                ) : null}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((o) => !o)}
                  className="flex w-full items-center justify-between gap-2 py-2.5 text-left text-sm text-zinc-200 transition hover:text-white"
                >
                  <span>Advanced settings</span>
                  <span
                    className="text-zinc-500 transition-transform duration-200"
                    style={{ transform: advancedOpen ? "rotate(90deg)" : "none" }}
                    aria-hidden
                  >
                    &gt;
                  </span>
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-200 ease-out"
                  style={{ gridTemplateRows: advancedOpen ? "1fr" : "0fr" }}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="space-y-3 border-t border-white/10 pt-3">
                      <div>
                        <label className="text-xs text-zinc-500" htmlFor="am-display">
                          Label <span className="text-zinc-600">(optional)</span>
                        </label>
                        <input
                          id="am-display"
                          value={form.displayName}
                          onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                          placeholder="Defaults to hostname from URL"
                          className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/35"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs text-zinc-500" htmlFor="am-interval">
                            Check interval
                          </label>
                          <input
                            id="am-interval"
                            value={form.checkInterval}
                            onChange={(e) => setForm((f) => ({ ...f, checkInterval: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/35"
                            placeholder="1 min"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500" htmlFor="am-to">
                            Timeout (ms)
                          </label>
                          <input
                            id="am-to"
                            type="number"
                            min={1000}
                            step={500}
                            value={form.timeoutMs}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, timeoutMs: Number(e.target.value || 10000) }))
                            }
                            className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/35"
                          />
                        </div>
                      </div>
                      {errors.checkInterval || errors.timeoutMs ? (
                        <p className="text-xs text-rose-400">
                          {[errors.checkInterval, errors.timeoutMs].filter(Boolean).join(" ")}
                        </p>
                      ) : null}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-zinc-500" htmlFor="am-ft">
                            Failure threshold
                          </label>
                          <input
                            id="am-ft"
                            type="number"
                            min={1}
                            max={10}
                            value={form.failureThreshold}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, failureThreshold: Number(e.target.value || 3) }))
                            }
                            className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2.5 text-sm text-zinc-100"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500" htmlFor="am-rc">
                            Retries
                          </label>
                          <input
                            id="am-rc"
                            type="number"
                            min={0}
                            max={5}
                            value={form.retryCount}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, retryCount: Number(e.target.value || 0) }))
                            }
                            className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2.5 text-sm text-zinc-100"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500" htmlFor="am-desc">
                          Notes <span className="text-zinc-600">(optional)</span>
                        </label>
                        <textarea
                          id="am-desc"
                          value={form.description}
                          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                          rows={2}
                          className="mt-1 w-full resize-none rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/35"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {submitError ? (
              <p
                id="add-mon-err"
                className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
                role="alert"
              >
                {submitError}
              </p>
            ) : null}

            <div className="mt-5 space-y-3">
              <button
                type="submit"
                disabled={isSaving || !getDefById(form.monitorTypeId).available}
                className="w-full rounded-xl border border-white/5 bg-white py-3.5 text-sm font-bold tracking-[0.2em] text-black uppercase transition enabled:hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isSaving ? "Adding…" : "Add monitor"}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-xs font-medium tracking-[0.25em] text-zinc-500 uppercase transition hover:text-zinc-300"
                >
                  Close
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
