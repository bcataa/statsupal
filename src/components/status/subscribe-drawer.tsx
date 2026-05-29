"use client";

import { useEffect, useRef, useState } from "react";

type Channel = { id: string; label: string; icon: React.ReactNode };

const CHANNELS: Channel[] = [
  { id: "email", label: "Email", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  )},
  { id: "sms", label: "SMS", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"/><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"/><path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"/>
    </svg>
  )},
  { id: "slack", label: "Slack", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zm2.521-10.123a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
    </svg>
  )},
  { id: "teams", label: "Microsoft Teams", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2h-2v2h2V2zm2 2h-2v2h2V4zm-4 2V4h-2v2h2zM14.12 4a.97.97 0 0 0-.12.5V8h-2V4.5A.5.5 0 0 0 11.5 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2h4V8h-3.88zM12 18H4V6h8v12z"/>
    </svg>
  )},
  { id: "gchat", label: "Google Chat", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
    </svg>
  )},
  { id: "webhook", label: "Webhook", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"/><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"/><path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"/>
    </svg>
  )},
];

type SubscribeDrawerProps = {
  open: boolean;
  onClose: () => void;
  projectSlug: string;
  brand: string;
};

type Step = "channels" | "email" | "success";

export function SubscribeDrawer({ open, onClose, projectSlug, brand }: SubscribeDrawerProps) {
  const [step, setStep] = useState<Step>("channels");
  const [email, setEmail] = useState("");
  const [incidentCreated, setIncidentCreated] = useState(true);
  const [incidentResolved, setIncidentResolved] = useState(true);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setStep("channels"); setEmail(""); setError(null); }
  }, [open]);

  useEffect(() => {
    if (step === "email" && open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [step, open]);

  const subscribe = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/status/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectSlug, email: email.trim(), incidentCreated, incidentResolved, maintenanceAlerts }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error((body as { message?: string }).message || "Subscription failed.");
      setStep("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal
        aria-label="Subscribe to status updates"
        className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-sm flex-col overflow-hidden border-l border-white/10 bg-[#0d0f1e] shadow-2xl sm:max-w-[380px]"
      >
        {/* Top accent */}
        <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${brand}cc, transparent)` }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <p className="text-base font-bold text-white">Get updates</p>
            <p className="mt-0.5 text-xs text-zinc-500">Choose how to receive status updates</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/8 hover:text-zinc-200"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {step === "channels" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Notification channels</p>
              <div className="overflow-hidden rounded-2xl border border-white/8">
                {CHANNELS.map((ch, i) => {
                  const isEmail = ch.id === "email";
                  const available = isEmail;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={isEmail ? () => setStep("email") : undefined}
                      className={[
                        "flex w-full items-center justify-between px-4 py-3.5 text-sm transition",
                        i < CHANNELS.length - 1 ? "border-b border-white/5" : "",
                        available ? "hover:bg-white/[0.04] cursor-pointer" : "cursor-default",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <span className={available ? "text-zinc-300" : "text-zinc-600"}>{ch.icon}</span>
                        <span className={available ? "font-medium text-zinc-200" : "text-zinc-500"}>{ch.label}</span>
                      </div>
                      {available ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-zinc-500">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      ) : (
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-600">Soon</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-xs text-zinc-600">More channels coming soon</p>
            </div>
          )}

          {step === "email" && (
            <div className="space-y-5">
              <button type="button" onClick={() => setStep("channels")} className="flex items-center gap-1 text-xs text-zinc-500 transition hover:text-zinc-300">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                Back
              </button>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Email subscription</p>
                <p className="mt-1 text-xs text-zinc-600">You'll get an email when something changes.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email address</label>
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void subscribe(); }}
                  placeholder="you@company.com"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Notify me when</p>
                {[
                  { label: "Incident starts", val: incidentCreated, set: setIncidentCreated },
                  { label: "Incident resolved", val: incidentResolved, set: setIncidentResolved },
                  { label: "Maintenance scheduled", val: maintenanceAlerts, set: setMaintenanceAlerts },
                ].map((opt) => (
                  <label key={opt.label} className="flex cursor-pointer items-center justify-between py-2">
                    <span className="text-sm text-zinc-300">{opt.label}</span>
                    <input
                      type="checkbox"
                      checked={opt.val}
                      onChange={(e) => opt.set(e.target.checked)}
                      className="h-4 w-4 cursor-pointer rounded border-white/20 bg-zinc-900 accent-indigo-500"
                    />
                  </label>
                ))}
              </div>

              {error && (
                <p className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">{error}</p>
              )}

              <button
                type="button"
                onClick={() => void subscribe()}
                disabled={submitting}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-500 disabled:opacity-60"
              >
                {submitting ? "Subscribing…" : "Subscribe"}
              </button>
              <p className="text-center text-xs text-zinc-600">Unsubscribe any time via the link in the email.</p>
            </div>
          )}

          {step === "success" && (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: `${brand}22`, boxShadow: `0 0 32px ${brand}44` }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: brand }}>
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-white">You're subscribed!</p>
                <p className="mt-1 text-sm text-zinc-400">We'll send updates to <span className="text-zinc-200">{email}</span></p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 rounded-xl border border-white/15 px-6 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/25 hover:text-white"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
