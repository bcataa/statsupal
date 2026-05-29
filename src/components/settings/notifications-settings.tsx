"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useAppData } from "@/state/app-data-provider";
import { formatDateTime } from "@/lib/utils/date-time";

/* ── Icons ─────────────────────────────────────────────────────────── */
function IconEmail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
function IconDiscord() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}
function IconWebhook() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2" />
      <path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06" />
      <path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8" />
    </svg>
  );
}
function IconSlack() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zm2.521-10.123a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}
function IconTeams() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2h-2v2h2V2zm2 2h-2v2h2V4zm-4 2V4h-2v2h2zM14.12 4a.97.97 0 0 0-.12.5V8h-2V4.5A.5.5 0 0 0 11.5 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2h4V8h-3.88zM12 18H4V6h8v12z" />
    </svg>
  );
}
function IconSMS() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 15.92z" />
    </svg>
  );
}
function IconRSS() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" />
    </svg>
  );
}
function IconAPI() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
function IconGoogleChat() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 14H5.17L4 17.17V4h16v12z" />
    </svg>
  );
}

/* ── Toggle switch ──────────────────────────────────────────────────── */
function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950",
        checked ? "bg-cyan-500" : "bg-zinc-700",
        disabled ? "cursor-not-allowed opacity-40" : "",
      ].join(" ")}
    >
      <span className={["h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0"].join(" ")} />
    </button>
  );
}

/* ── Channel definition ─────────────────────────────────────────────── */
type Channel = {
  id: string;
  label: string;
  icon: React.ReactNode;
  available: boolean;
  badge?: string;
};

const CHANNELS: Channel[] = [
  { id: "email",    label: "Email",           icon: <IconEmail />,      available: true  },
  { id: "slack",    label: "Slack",            icon: <IconSlack />,      available: false, badge: "Soon" },
  { id: "teams",    label: "Microsoft Teams",  icon: <IconTeams />,      available: false, badge: "Soon" },
  { id: "gchat",    label: "Google Chat",      icon: <IconGoogleChat />, available: false, badge: "Soon" },
  { id: "webhook",  label: "Webhook",          icon: <IconWebhook />,    available: true  },
  { id: "sms",      label: "SMS",              icon: <IconSMS />,        available: false, badge: "Soon" },
  { id: "discord",  label: "Discord",          icon: <IconDiscord />,    available: true  },
  { id: "api",      label: "API",              icon: <IconAPI />,        available: true  },
  { id: "rss",      label: "RSS & Atom",       icon: <IconRSS />,        available: false, badge: "Soon" },
];

/* ── Right panel — subscription channels shown to public ───────────── */
const PUBLIC_CHANNELS = [
  { icon: <IconEmail />,  label: "Email"           },
  { icon: <IconSMS />,    label: "SMS"             },
  { icon: <IconSlack />,  label: "Slack"           },
  { icon: <IconTeams />,  label: "Microsoft Teams" },
  { icon: <IconGoogleChat />, label: "Google Chat" },
  { icon: <IconWebhook />, label: "Webhook"        },
];

/* ═══════════════════════════════════════════════════════════════════ */
export function NotificationsSettings({
  incidentAlerts,
  maintenanceAlerts,
  incidentEmailAlerts,
  maintenanceEmailAlerts,
  discordWebhookUrl,
  alertEmail,
  supportEmail,
  discordGuildId,
  discordBotConfigured,
  discordBotChannelId,
  discordOauthAuthorizeUrl,
  discordInviteUrl,
  discordChannelOptions,
  channelsLoading,
  channelListError,
  botConfigLoading,
  discordDisconnecting,
  notificationSaving,
  testingEmail,
  testingDiscord,
  notificationSaveState,
  notificationTestState,
  notificationsLastSavedAt,
  showOauthChannelSelect,
  legacyDiscordChannelField,
  usesManagedBotToken,
  setIncidentAlerts,
  setMaintenanceAlerts,
  setIncidentEmailAlerts,
  setMaintenanceEmailAlerts,
  setDiscordWebhookUrl,
  setAlertEmail,
  setSupportEmail,
  setDiscordBotChannelId,
  onNotificationSave,
  onDisconnectDiscord,
  onSendTestNotification,
}: {
  incidentAlerts: boolean;
  maintenanceAlerts: boolean;
  incidentEmailAlerts: boolean;
  maintenanceEmailAlerts: boolean;
  discordWebhookUrl: string;
  alertEmail: string;
  supportEmail: string;
  discordGuildId: string;
  discordBotConfigured: boolean;
  discordBotChannelId: string;
  discordOauthAuthorizeUrl: string | null;
  discordInviteUrl: string | null;
  discordChannelOptions: { id: string; name: string }[];
  channelsLoading: boolean;
  channelListError: string | null;
  botConfigLoading: boolean;
  discordDisconnecting: boolean;
  notificationSaving: boolean;
  testingEmail: boolean;
  testingDiscord: boolean;
  notificationSaveState: { tone: "success" | "error"; message: string } | null;
  notificationTestState: { tone: "success" | "error"; message: string } | null;
  notificationsLastSavedAt: string | null;
  showOauthChannelSelect: boolean;
  legacyDiscordChannelField: boolean;
  usesManagedBotToken: boolean;
  setIncidentAlerts: (v: boolean) => void;
  setMaintenanceAlerts: (v: boolean) => void;
  setIncidentEmailAlerts: (v: boolean) => void;
  setMaintenanceEmailAlerts: (v: boolean) => void;
  setDiscordWebhookUrl: (v: string) => void;
  setAlertEmail: (v: string) => void;
  setSupportEmail: (v: string) => void;
  setDiscordBotChannelId: (v: string) => void;
  onNotificationSave: (e: FormEvent<HTMLFormElement>) => void;
  onDisconnectDiscord: () => void;
  onSendTestNotification: (type: "email" | "discord") => void;
}) {
  const emailOn = incidentEmailAlerts || maintenanceEmailAlerts;
  const discordOn = (discordWebhookUrl.trim().length > 0 || discordBotConfigured);
  const channelEnabled: Record<string, boolean> = {
    email:   emailOn,
    discord: discordOn,
    webhook: discordWebhookUrl.trim().length > 0,
    api:     true,
    slack:   false, teams: false, gchat: false, sms: false, rss: false,
  };
  const automatedIncident: Record<string, boolean> = {
    email: incidentEmailAlerts, discord: incidentAlerts, webhook: incidentAlerts,
    api: false, slack: false, teams: false, gchat: false, sms: false, rss: false,
  };
  const automatedMaintenance: Record<string, boolean> = {
    email: maintenanceEmailAlerts, discord: maintenanceAlerts, webhook: maintenanceAlerts,
    api: false, slack: false, teams: false, gchat: false, sms: false, rss: false,
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-white/8 bg-[#0c0e18]/70 backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/6 px-6 py-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-300">Notifications</h3>
          <p className="mt-0.5 text-xs text-zinc-500">Configure how your team and status-page subscribers get alerted.</p>
        </div>
        {notificationsLastSavedAt && (
          <p className="text-xs text-zinc-600">Last saved {formatDateTime(notificationsLastSavedAt)}</p>
        )}
      </div>

      <form onSubmit={onNotificationSave}>
        <div className="grid gap-0 lg:grid-cols-[1fr_180px_1fr]">
          {/* ── Left: channel list ─────────────────────────────────── */}
          <div className="border-b border-white/6 lg:border-b-0 lg:border-r">
            <div className="border-b border-white/6 px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Channel</p>
            </div>
            {CHANNELS.map((ch) => (
              <div key={ch.id} className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3.5 last:border-0 hover:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <span className={ch.available ? "text-zinc-300" : "text-zinc-600"}>{ch.icon}</span>
                  <span className={["text-sm font-medium", ch.available ? "text-zinc-200" : "text-zinc-500"].join(" ")}>
                    {ch.label}
                  </span>
                  {ch.badge && (
                    <span className="rounded-full bg-white/8 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
                      {ch.badge}
                    </span>
                  )}
                </div>
                <Toggle
                  checked={channelEnabled[ch.id] ?? false}
                  onChange={() => {}}
                  disabled={!ch.available}
                />
              </div>
            ))}
          </div>

          {/* ── Middle: send automated updates ─────────────────────── */}
          <div className="border-b border-white/6 lg:border-b-0 lg:border-r">
            <div className="border-b border-white/6 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 leading-tight">
                Send automated<br />updates
              </p>
            </div>
            {CHANNELS.map((ch) => (
              <div key={ch.id} className="flex items-center justify-center border-b border-white/[0.04] px-4 py-3.5 last:border-0">
                {ch.available && (ch.id === "email" || ch.id === "discord" || ch.id === "webhook") ? (
                  <input
                    type="checkbox"
                    checked={automatedIncident[ch.id] ?? false}
                    onChange={() => {
                      if (ch.id === "email") setIncidentEmailAlerts(!incidentEmailAlerts);
                      if (ch.id === "discord" || ch.id === "webhook") setIncidentAlerts(!incidentAlerts);
                    }}
                    className="h-4 w-4 cursor-pointer rounded border-white/20 bg-zinc-900 accent-cyan-500"
                  />
                ) : (
                  <span className="h-4 w-4 rounded border border-white/10 bg-white/[0.03]" />
                )}
              </div>
            ))}
          </div>

          {/* ── Right: Get updates card ─────────────────────────────── */}
          <div className="px-5 py-5">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              <button
                type="button"
                className="w-full rounded-xl bg-white/8 py-2.5 text-sm font-semibold text-zinc-100 transition hover:bg-white/12"
              >
                Get updates
              </button>

              <div className="mt-4 space-y-3">
                {PUBLIC_CHANNELS.map((c) => (
                  <div key={c.label} className="flex items-center gap-3 text-sm text-zinc-400">
                    <span className="text-zinc-500">{c.icon}</span>
                    {c.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Email config */}
            <div className="mt-5 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Alert email</label>
                <input
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                  placeholder="alerts@company.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Support email</label>
                <input
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                  placeholder="support@company.com"
                />
              </div>
            </div>

            {/* Maintenance toggle */}
            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-center justify-between gap-3 text-xs text-zinc-400">
                Incident email alerts
                <Toggle checked={incidentEmailAlerts} onChange={setIncidentEmailAlerts} />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 text-xs text-zinc-400">
                Maintenance email alerts
                <Toggle checked={maintenanceEmailAlerts} onChange={setMaintenanceEmailAlerts} />
              </label>
            </div>
          </div>
        </div>

        {/* Discord configuration */}
        <div className="border-t border-white/6 px-6 py-5">
          <div className={["rounded-2xl border border-white/8 bg-white/[0.03] p-5 transition-opacity", botConfigLoading ? "opacity-60 pointer-events-none" : ""].join(" ")}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5865F2]/20 text-[#5865F2]">
                <IconDiscord />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-200">Discord Notifications</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={["h-2 w-2 rounded-full", discordGuildId.trim() ? "bg-emerald-400" : "bg-zinc-600"].join(" ")} />
                  <span className="text-xs text-zinc-500">
                    {botConfigLoading ? "Checking…" : discordGuildId.trim() ? (discordBotConfigured ? "Connected — alerts ready" : "Connected — pick a channel") : "Not connected"}
                  </span>
                </div>
              </div>
              {discordGuildId.trim() && (
                <button type="button" onClick={onDisconnectDiscord} disabled={discordDisconnecting}
                  className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline disabled:opacity-40">
                  {discordDisconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              )}
            </div>

            {!discordGuildId.trim() && (discordOauthAuthorizeUrl || discordInviteUrl) && (
              <button type="button" onClick={() => { if (discordOauthAuthorizeUrl) window.location.href = discordOauthAuthorizeUrl; else if (discordInviteUrl) window.location.href = discordInviteUrl; }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] py-2.5 text-sm font-semibold text-white transition hover:bg-[#4752C4]">
                <IconDiscord /> Add Bot to Server
              </button>
            )}
            {!discordGuildId.trim() && !discordOauthAuthorizeUrl && !discordInviteUrl && (
              <p className="mt-3 text-xs text-zinc-600">Set <code className="text-zinc-500">DISCORD_CLIENT_ID</code> env var to enable the bot invite.</p>
            )}
            {discordGuildId.trim() && showOauthChannelSelect && (
              <select value={discordBotChannelId} onChange={(e) => setDiscordBotChannelId(e.target.value)} disabled={channelsLoading}
                className="mt-4 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-cyan-500/50 disabled:opacity-60">
                <option value="">Select a channel</option>
                {discordChannelOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            {discordGuildId.trim() && legacyDiscordChannelField && !showOauthChannelSelect && (
              <input value={discordBotChannelId} onChange={(e) => setDiscordBotChannelId(e.target.value)}
                className="mt-4 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-cyan-500/50"
                placeholder="Channel ID" />
            )}
            <div>
              <label className="mb-1 mt-4 block text-xs font-medium text-zinc-500">Discord webhook URL (fallback)</label>
              <input value={discordWebhookUrl} onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-cyan-500/50"
                placeholder="https://discord.com/api/webhooks/…" />
              <p className="mt-1 text-xs text-zinc-600">{usesManagedBotToken ? "Bot token active. Webhook is fallback." : "Used when bot delivery fails or isn't configured."}</p>
            </div>
          </div>
        </div>

        {/* Feedback + actions */}
        <div className="border-t border-white/6 px-6 py-4">
          {notificationSaveState && (
            <p className={["mb-3 rounded-xl px-4 py-2.5 text-sm", notificationSaveState.tone === "success" ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-300" : "border border-rose-400/20 bg-rose-500/10 text-rose-300"].join(" ")}>
              {notificationSaveState.tone === "success" ? "✓ " : ""}{notificationSaveState.message}
            </p>
          )}
          {notificationTestState && (
            <p className={["mb-3 rounded-xl px-4 py-2.5 text-sm", notificationTestState.tone === "success" ? "border border-sky-400/20 bg-sky-500/10 text-sky-300" : "border border-rose-400/20 bg-rose-500/10 text-rose-300"].join(" ")}>
              {notificationTestState.message}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onSendTestNotification("email")} disabled={testingEmail || notificationSaving}
                className="inline-flex h-9 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-medium text-zinc-300 transition hover:bg-white/10 disabled:opacity-50">
                {testingEmail ? "Sending…" : "Test email"}
              </button>
              <button type="button" onClick={() => onSendTestNotification("discord")} disabled={testingDiscord || notificationSaving}
                className="inline-flex h-9 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-medium text-zinc-300 transition hover:bg-white/10 disabled:opacity-50">
                {testingDiscord ? "Sending…" : "Test Discord"}
              </button>
            </div>
            <button type="submit" disabled={notificationSaving || botConfigLoading}
              className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-500 disabled:opacity-50">
              {notificationSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
