"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { toSlug } from "@/lib/utils/slug";
import { useAppData } from "@/state/app-data-provider";

type SaveState = {
  tone: "success" | "error";
  message: string;
} | null;

type SectionFeedback = {
  tone: "success" | "error";
  message: string;
} | null;

function DiscordLogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export default function SettingsPage() {
  const {
    workspace,
    currentProject,
    isHydrated,
    updateWorkspaceInfo,
    setOnboardingState,
    maintenanceWindows,
    createMaintenanceWindow,
  } = useAppData();
  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const [projectName, setProjectName] = useState(currentProject?.name ?? "");
  const [publicDescription, setPublicDescription] = useState(
    workspace.publicDescription ?? "Real-time system status and incident updates.",
  );
  const [statusPageSlug, setStatusPageSlug] = useState(
    currentProject?.slug ?? workspace.domainSettings.statusPageSlug,
  );
  const [incidentAlerts, setIncidentAlerts] = useState(
    workspace.notificationSettings.incidentAlertsEnabled,
  );
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(
    workspace.notificationSettings.maintenanceAlertsEnabled,
  );
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(
    workspace.notificationSettings.discordWebhookUrl ?? "",
  );
  const [alertEmail, setAlertEmail] = useState(workspace.notificationSettings.alertEmail ?? "");
  const [supportEmail, setSupportEmail] = useState(
    workspace.notificationSettings.supportEmail ?? "",
  );
  const [incidentEmailAlerts, setIncidentEmailAlerts] = useState(
    workspace.notificationSettings.incidentEmailAlertsEnabled,
  );
  const [maintenanceEmailAlerts, setMaintenanceEmailAlerts] = useState(
    workspace.notificationSettings.maintenanceEmailAlertsEnabled,
  );
  const [customDomain, setCustomDomain] = useState(workspace.domainSettings.customDomain ?? "");
  const [workspaceSaving, setWorkspaceSaving] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [notificationSaveState, setNotificationSaveState] = useState<SectionFeedback>(null);
  const [notificationTestState, setNotificationTestState] = useState<SectionFeedback>(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingDiscord, setTestingDiscord] = useState(false);
  const [domainSaving, setDomainSaving] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>(null);
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false);
  const [maintenanceTitle, setMaintenanceTitle] = useState("");
  const [maintenanceDescription, setMaintenanceDescription] = useState("");
  const [maintenanceStartsAt, setMaintenanceStartsAt] = useState("");
  const [maintenanceEndsAt, setMaintenanceEndsAt] = useState("");
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [discordBotChannelId, setDiscordBotChannelId] = useState("");
  const [discordBotConfigured, setDiscordBotConfigured] = useState(false);
  const [discordInviteUrl, setDiscordInviteUrl] = useState<string | null>(null);
  const [discordOauthAuthorizeUrl, setDiscordOauthAuthorizeUrl] = useState<string | null>(null);
  const [discordGuildId, setDiscordGuildId] = useState("");
  const [discordChannels, setDiscordChannels] = useState<{ id: string; name: string }[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelListError, setChannelListError] = useState<string | null>(null);
  const [discordDisconnecting, setDiscordDisconnecting] = useState(false);
  const [usesManagedBotToken, setUsesManagedBotToken] = useState(false);
  const [botConfigLoading, setBotConfigLoading] = useState(true);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountEmail, setAccountEmail] = useState<string>("Not available");

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setWorkspaceName(workspace.name);
    setProjectName(currentProject?.name ?? "");
    setStatusPageSlug(currentProject?.slug ?? workspace.domainSettings.statusPageSlug);
    setCustomDomain(workspace.domainSettings.customDomain ?? "");
    setPublicDescription(workspace.publicDescription ?? "Real-time system status and incident updates.");
  }, [
    currentProject?.name,
    currentProject?.slug,
    workspace.domainSettings.customDomain,
    workspace.domainSettings.statusPageSlug,
    workspace.publicDescription,
    workspace.name,
  ]);

  useEffect(() => {
    setIncidentAlerts(workspace.notificationSettings.incidentAlertsEnabled);
    setMaintenanceAlerts(workspace.notificationSettings.maintenanceAlertsEnabled);
    setDiscordWebhookUrl(workspace.notificationSettings.discordWebhookUrl ?? "");
    setAlertEmail(workspace.notificationSettings.alertEmail ?? "");
    setSupportEmail(workspace.notificationSettings.supportEmail ?? "");
    setIncidentEmailAlerts(workspace.notificationSettings.incidentEmailAlertsEnabled);
    setMaintenanceEmailAlerts(workspace.notificationSettings.maintenanceEmailAlertsEnabled);
  }, [workspace.notificationSettings]);

  const loadDiscordBotConfig = useCallback(async () => {
    try {
      setBotConfigLoading(true);
      const response = await fetch("/api/notifications/config", { method: "GET" });
      const body = await response.json();
      if (!response.ok || !body?.success) {
        throw new Error(body?.message || "Could not load Discord bot configuration.");
      }
      setDiscordBotConfigured(Boolean(body.discordBotConfigured));
      setDiscordBotChannelId(body.discordBotChannelId ?? "");
      setDiscordInviteUrl(body.inviteUrl ?? null);
      setDiscordOauthAuthorizeUrl(body.discordOauthAuthorizeUrl ?? null);
      setDiscordGuildId(typeof body.discordGuildId === "string" ? body.discordGuildId : "");
      setUsesManagedBotToken(Boolean(body.usesManagedBotToken));
    } catch (error) {
      console.error("[Settings] discord bot config load failed", error);
      setNotificationSaveState({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not load Discord bot configuration.",
      });
    } finally {
      setBotConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDiscordBotConfig();
  }, [loadDiscordBotConfig]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const discord = params.get("discord");
    if (!discord) {
      return;
    }
    const messages: Record<string, string> = {
      connected: "Server linked. Choose a channel below, then save changes.",
      denied: "Discord authorization was cancelled.",
      bad_state: "Discord sign-in expired. Try Invite again.",
      no_guild: "No server was selected. Choose a server when Discord asks.",
      session: "Your session changed during Discord sign-in. Sign in and try again.",
      no_bot_token: "Server is missing DISCORD_BOT_TOKEN. Contact support.",
      token_exchange: "Could not finish Discord sign-in. Check redirect URL and client secret.",
      save_failed: "Could not save the Discord server link.",
      schema: "Database needs an update (discord_guild_id). Apply latest schema.sql.",
      oauth_not_configured: "Discord OAuth is not configured on the server.",
      missing_params: "Discord sign-in was incomplete. Try again.",
      discord_error: "Discord returned an error. Try again later.",
    };
    const message = messages[discord] ?? "Something went wrong connecting Discord.";
    setNotificationSaveState({
      tone: discord === "connected" ? "success" : "error",
      message,
    });
    if (discord === "connected") {
      void loadDiscordBotConfig();
    }
    const path = window.location.pathname;
    window.history.replaceState({}, "", path);
  }, [loadDiscordBotConfig]);

  useEffect(() => {
    if (!discordGuildId.trim()) {
      setDiscordChannels([]);
      setChannelListError(null);
      return;
    }
    let cancelled = false;
    const loadChannels = async () => {
      setChannelsLoading(true);
      setChannelListError(null);
      try {
        const response = await fetch("/api/discord/channels");
        const body = await response.json();
        if (cancelled) {
          return;
        }
        if (!response.ok || !body?.success) {
          throw new Error(body?.message || "Could not load channels.");
        }
        setDiscordChannels(Array.isArray(body.channels) ? body.channels : []);
      } catch (error) {
        if (!cancelled) {
          setDiscordChannels([]);
          setChannelListError(
            error instanceof Error ? error.message : "Could not load channels.",
          );
        }
      } finally {
        if (!cancelled) {
          setChannelsLoading(false);
        }
      }
    };
    void loadChannels();
    return () => {
      cancelled = true;
    };
  }, [discordGuildId]);

  const discordChannelOptions = useMemo(() => {
    const list = [...discordChannels];
    if (
      discordBotChannelId &&
      !list.some((channel) => channel.id === discordBotChannelId)
    ) {
      list.unshift({ id: discordBotChannelId, name: "Current channel" });
    }
    return list;
  }, [discordBotChannelId, discordChannels]);

  const legacyDiscordChannelField =
    !discordGuildId.trim() && !discordOauthAuthorizeUrl && Boolean(discordInviteUrl);
  const showOauthChannelSelect = Boolean(discordGuildId.trim());

  useEffect(() => {
    if (notificationSaveState?.tone !== "success") {
      return;
    }
    const timer = setTimeout(() => {
      setNotificationSaveState(null);
    }, 2600);
    return () => clearTimeout(timer);
  }, [notificationSaveState]);

  useEffect(() => {
    const loadAccountInfo = async () => {
      if (!supabase) {
        setAccountLoading(false);
        setAccountEmail("Supabase not configured");
        return;
      }

      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        setAccountEmail(user?.email ?? "Not available");
      } catch (error) {
        console.error("[Settings] account info load failed", error);
        setAccountEmail("Could not load account email");
      } finally {
        setAccountLoading(false);
      }
    };

    void loadAccountInfo();
  }, [supabase]);

  const onWorkspaceSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState(null);

    const trimmedWorkspace = workspaceName.trim();
    const trimmedProject = projectName.trim();

    if (!trimmedWorkspace || !trimmedProject) {
      setSaveState({
        tone: "error",
        message: "Workspace name and project name are required.",
      });
      return;
    }

    try {
      setWorkspaceSaving(true);
      updateWorkspaceInfo({
        workspaceName: trimmedWorkspace,
        projectName: trimmedProject,
        projectSlug: statusPageSlug.trim() ? toSlug(statusPageSlug.trim()) : toSlug(trimmedProject),
        publicDescription: publicDescription.trim(),
      });
      setSaveState({
        tone: "success",
        message: "Workspace settings saved successfully.",
      });
    } catch (error) {
      console.error("[Settings] workspace save failed", error);
      setSaveState({
        tone: "error",
        message: "Could not save workspace settings. Please try again.",
      });
    } finally {
      setWorkspaceSaving(false);
    }
  };

  const onNotificationSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotificationSaveState(null);
    setNotificationTestState(null);

    try {
      setNotificationSaving(true);
      updateWorkspaceInfo({
        incidentAlertsEnabled: incidentAlerts,
        maintenanceAlertsEnabled: maintenanceAlerts,
        incidentEmailAlertsEnabled: incidentEmailAlerts,
        maintenanceEmailAlertsEnabled: maintenanceEmailAlerts,
        discordWebhookUrl: discordWebhookUrl.trim(),
        alertEmail: alertEmail.trim(),
        supportEmail: supportEmail.trim(),
      });
      const nextBotChannelId = discordBotChannelId.trim();
      const botConfigResponse = await fetch("/api/notifications/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordBotChannelId: nextBotChannelId,
        }),
      });
      const botConfigBody = await botConfigResponse.json();
      if (!botConfigResponse.ok || !botConfigBody?.success) {
        throw new Error(botConfigBody?.message || "Could not save Discord bot integration.");
      }
      setDiscordBotConfigured(Boolean(botConfigBody.discordBotConfigured));
      setDiscordBotChannelId(botConfigBody.discordBotChannelId ?? "");
      if (typeof botConfigBody.discordGuildId === "string") {
        setDiscordGuildId(botConfigBody.discordGuildId);
      } else if (!botConfigBody.discordBotConfigured && !botConfigBody.discordGuildId) {
        setDiscordGuildId("");
      }
      setOnboardingState({ alertsConfigured: incidentAlerts });
      setNotificationSaveState({
        tone: "success",
        message: "Changes saved",
      });
    } catch (error) {
      console.error("[Settings] notification save failed", error);
      setNotificationSaveState({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not save notification preferences. Please try again.",
      });
    } finally {
      setNotificationSaving(false);
    }
  };

  const onDisconnectDiscord = async () => {
    setNotificationSaveState(null);
    setNotificationTestState(null);
    try {
      setDiscordDisconnecting(true);
      const response = await fetch("/api/notifications/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearDiscord: true }),
      });
      const body = await response.json();
      if (!response.ok || !body?.success) {
        throw new Error(body?.message || "Could not disconnect Discord.");
      }
      setDiscordBotConfigured(false);
      setDiscordBotChannelId("");
      setDiscordGuildId("");
      setDiscordChannels([]);
      setChannelListError(null);
      setNotificationSaveState({
        tone: "success",
        message: "Discord disconnected.",
      });
    } catch (error) {
      setNotificationSaveState({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not disconnect Discord.",
      });
    } finally {
      setDiscordDisconnecting(false);
    }
  };

  const onSendTestNotification = async (type: "email" | "discord") => {
    setNotificationTestState(null);
    try {
      if (type === "email") {
        setTestingEmail(true);
      } else {
        setTestingDiscord(true);
      }
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const body = await response.json();
      if (!response.ok || !body?.success) {
        throw new Error(body?.message || "Could not send test notification.");
      }
      setNotificationTestState({
        tone: "success",
        message: body?.message || "Test notification sent.",
      });
    } catch (error) {
      setNotificationTestState({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not send test notification. Please try again.",
      });
    } finally {
      setTestingEmail(false);
      setTestingDiscord(false);
    }
  };

  const onVerifyDomain = async () => {
    if (!customDomain.trim()) {
      setSaveState({ tone: "error", message: "Enter a custom domain first." });
      return;
    }
    try {
      setIsVerifyingDomain(true);
      const response = await fetch("/api/domain/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: customDomain.trim() }),
      });
      const body = await response.json();
      if (!response.ok || !body?.success) {
        throw new Error(body?.message || "Domain verification failed.");
      }
      updateWorkspaceInfo({
        customDomain: customDomain.trim(),
        customDomainStatus: body.verified ? "verified" : "failed",
      });
      setSaveState({
        tone: body.verified ? "success" : "error",
        message: body.verified
          ? "Domain verified successfully."
          : "Domain could not be verified. Check your CNAME and try again.",
      });
    } catch (error) {
      setSaveState({
        tone: "error",
        message: error instanceof Error ? error.message : "Domain verification failed.",
      });
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  const onCreateMaintenance = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState(null);
    if (!maintenanceTitle.trim() || !maintenanceStartsAt || !maintenanceEndsAt) {
      setSaveState({ tone: "error", message: "Maintenance title, start, and end are required." });
      return;
    }
    try {
      setMaintenanceSaving(true);
      await createMaintenanceWindow({
        title: maintenanceTitle.trim(),
        description: maintenanceDescription.trim() || undefined,
        startsAt: new Date(maintenanceStartsAt).toISOString(),
        endsAt: new Date(maintenanceEndsAt).toISOString(),
        affectedServiceIds: [],
      });
      setMaintenanceTitle("");
      setMaintenanceDescription("");
      setMaintenanceStartsAt("");
      setMaintenanceEndsAt("");
      setSaveState({ tone: "success", message: "Maintenance window created." });
    } catch (error) {
      setSaveState({
        tone: "error",
        message: error instanceof Error ? error.message : "Could not create maintenance window.",
      });
    } finally {
      setMaintenanceSaving(false);
    }
  };

  const onDomainSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState(null);

    try {
      setDomainSaving(true);
      updateWorkspaceInfo({
        projectSlug: statusPageSlug.trim() ? toSlug(statusPageSlug.trim()) : undefined,
        customDomain: customDomain.trim(),
        customDomainStatus: customDomain.trim() ? "pending_verification" : "unconfigured",
      });
      setSaveState({
        tone: "success",
        message:
          customDomain.trim().length > 0
            ? "Custom domain saved. Run Verify domain after your DNS CNAME is configured."
            : "Status page domain settings saved.",
      });
    } catch (error) {
      console.error("[Settings] domain save failed", error);
      setSaveState({
        tone: "error",
        message: "Could not save domain settings. Please try again.",
      });
    } finally {
      setDomainSaving(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">Loading settings...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Settings</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your workspace details, account information, and notification preferences.
        </p>
      </section>

      {saveState ? (
        <div
          className={[
            "rounded-xl border px-4 py-3 text-sm",
            saveState.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800",
          ].join(" ")}
        >
          {saveState.message}
        </div>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900">Workspace settings</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Update the names shown across your dashboard and status page.
        </p>
        <form className="mt-5 space-y-4" onSubmit={onWorkspaceSave}>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Workspace name</label>
            <input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              placeholder="My Workspace"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Project name</label>
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              placeholder="Main Status Page"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Public status description
            </label>
            <textarea
              value={publicDescription}
              onChange={(event) => setPublicDescription(event.target.value)}
              className="min-h-20 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={workspaceSaving}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {workspaceSaving ? "Saving..." : "Save workspace settings"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900">Account info</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Basic account details for the current signed-in user.
        </p>
        <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</p>
          <p className="mt-1 text-sm text-zinc-800">
            {accountLoading ? "Loading account..." : accountEmail}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900">Notification preferences</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Choose what updates your team should receive.
        </p>
        <form className="mt-5 space-y-4" onSubmit={onNotificationSave}>
          <label className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3">
            <input
              type="checkbox"
              checked={incidentAlerts}
              onChange={(event) => setIncidentAlerts(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900"
            />
            <span>
              <p className="text-sm font-medium text-zinc-900">Incident updates</p>
              <p className="text-xs text-zinc-500">Get notified when a service has issues.</p>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3">
            <input
              type="checkbox"
              checked={maintenanceAlerts}
              onChange={(event) => setMaintenanceAlerts(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900"
            />
            <span>
              <p className="text-sm font-medium text-zinc-900">Maintenance updates</p>
              <p className="text-xs text-zinc-500">
                Receive reminders for planned maintenance windows.
              </p>
            </span>
          </label>
          <div>
            <label
              htmlFor="discord-webhook"
              className="mb-1 block text-sm font-medium text-zinc-700"
            >
              Discord webhook URL (fallback)
            </label>
            <input
              id="discord-webhook"
              value={discordWebhookUrl}
              onChange={(event) => setDiscordWebhookUrl(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              placeholder="https://discord.com/api/webhooks/..."
            />
            <p className="mt-1 text-xs text-zinc-500">
              Used if bot-based delivery is not configured or fails.
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5865F2] text-white shadow-sm"
                aria-hidden
              >
                <DiscordLogoMark className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-zinc-900">Discord Notifications</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={[
                      "h-2 w-2 shrink-0 rounded-full",
                      discordGuildId.trim()
                        ? "bg-emerald-500"
                        : "bg-rose-500",
                    ].join(" ")}
                    aria-hidden
                  />
                  <span className="text-sm text-zinc-600">
                    {botConfigLoading
                      ? "Checking connection…"
                      : discordGuildId.trim()
                        ? discordBotConfigured
                          ? "Connected — alerts ready"
                          : "Connected — pick a channel"
                        : "Not connected"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {!discordGuildId.trim()
                    ? "Pick the server in Discord, then continue."
                    : discordBotConfigured
                      ? "Incident and maintenance alerts can post to your server."
                      : "Choose where alerts should be sent, then save changes."}
                </p>
              </div>
            </div>

            {!discordGuildId.trim() && (discordOauthAuthorizeUrl || discordInviteUrl) ? (
              <div className="mt-5">
                {discordOauthAuthorizeUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = discordOauthAuthorizeUrl;
                    }}
                    disabled={botConfigLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4752C4] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <DiscordLogoMark className="text-white" />
                    Add Bot to Server
                  </button>
                ) : (
                  <a
                    href={discordInviteUrl ?? "#"}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4752C4]"
                  >
                    <DiscordLogoMark className="text-white" />
                    Add Bot to Server
                  </a>
                )}
              </div>
            ) : null}

            {!discordGuildId.trim() && !discordOauthAuthorizeUrl && !discordInviteUrl ? (
              <p className="mt-4 text-xs text-zinc-500">
                Set <span className="font-mono text-zinc-700">DISCORD_CLIENT_ID</span> on the server
                to enable the bot invite. Add OAuth env vars to return here after you authorize in
                Discord.
              </p>
            ) : null}

            {discordGuildId.trim() ? (
              <div className="mt-5 border-t border-zinc-100 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm font-medium text-zinc-800" htmlFor="discord-alert-channel">
                    Alert channel
                  </label>
                  <button
                    type="button"
                    onClick={() => void onDisconnectDiscord()}
                    disabled={discordDisconnecting || notificationSaving || botConfigLoading}
                    className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-700 hover:underline disabled:opacity-50"
                  >
                    {discordDisconnecting ? "Disconnecting…" : "Disconnect"}
                  </button>
                </div>
                {showOauthChannelSelect ? (
                  <>
                    <select
                      id="discord-alert-channel"
                      value={discordBotChannelId}
                      onChange={(event) => setDiscordBotChannelId(event.target.value)}
                      disabled={channelsLoading || botConfigLoading}
                      className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 disabled:opacity-60"
                    >
                      <option value="">Select a channel</option>
                      {discordChannelOptions.map((channel) => (
                        <option key={channel.id} value={channel.id}>
                          {channel.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-zinc-500">
                      {channelsLoading
                        ? "Loading channels…"
                        : "Channels the bot can access in your server."}
                    </p>
                    {channelListError ? (
                      <p className="mt-1 text-xs text-rose-600">{channelListError}</p>
                    ) : null}
                  </>
                ) : legacyDiscordChannelField ? (
                  <>
                    <input
                      id="discord-alert-channel"
                      value={discordBotChannelId}
                      onChange={(event) => setDiscordBotChannelId(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
                      placeholder="Channel ID"
                    />
                    <p className="mt-1.5 text-xs text-zinc-500">
                      OAuth is not configured—paste a channel ID, or add Discord OAuth env vars for
                      the channel list.
                    </p>
                  </>
                ) : null}
              </div>
            ) : null}

            {legacyDiscordChannelField && !discordGuildId.trim() ? (
              <details className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2">
                <summary className="cursor-pointer text-xs font-medium text-zinc-600">
                  Advanced — invite without OAuth redirect
                </summary>
                <p className="mt-2 text-xs text-zinc-500">
                  If the app cannot complete the redirect flow, paste a channel ID after adding the bot.
                </p>
                <label className="sr-only" htmlFor="discord-legacy-channel">
                  Channel ID
                </label>
                <input
                  id="discord-legacy-channel"
                  value={discordBotChannelId}
                  onChange={(event) => setDiscordBotChannelId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
                  placeholder="Channel ID"
                />
              </details>
            ) : null}

            <p className="mt-4 text-xs text-zinc-400">
              {usesManagedBotToken
                ? "Bot credentials stay on the server. Webhook above is only used as a fallback."
                : "Configure a managed bot token on the server for delivery. Webhook fallback still works."}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Alert email</label>
              <input
                value={alertEmail}
                onChange={(event) => setAlertEmail(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
                placeholder="alerts@company.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Support email</label>
              <input
                value={supportEmail}
                onChange={(event) => setSupportEmail(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
                placeholder="support@company.com"
              />
            </div>
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3">
            <input
              type="checkbox"
              checked={incidentEmailAlerts}
              onChange={(event) => setIncidentEmailAlerts(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900"
            />
            <span>
              <p className="text-sm font-medium text-zinc-900">Incident email alerts</p>
              <p className="text-xs text-zinc-500">Send email on incident start and recovery.</p>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3">
            <input
              type="checkbox"
              checked={maintenanceEmailAlerts}
              onChange={(event) => setMaintenanceEmailAlerts(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900"
            />
            <span>
              <p className="text-sm font-medium text-zinc-900">Maintenance email alerts</p>
              <p className="text-xs text-zinc-500">
                Send planned maintenance announcements to subscribers.
              </p>
            </span>
          </label>
          {notificationSaveState ? (
            <div
              className={[
                "rounded-xl border px-3 py-2 text-sm",
                notificationSaveState.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800",
              ].join(" ")}
            >
              {notificationSaveState.tone === "success" ? "✓ " : ""}
              {notificationSaveState.message}
            </div>
          ) : null}
          {notificationTestState ? (
            <div
              className={[
                "rounded-xl border px-3 py-2 text-sm",
                notificationTestState.tone === "success"
                  ? "border-sky-200 bg-sky-50 text-sky-800"
                  : "border-rose-200 bg-rose-50 text-rose-800",
              ].join(" ")}
            >
              {notificationTestState.message}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onSendTestNotification("email")}
              disabled={testingEmail || notificationSaving}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {testingEmail ? "Sending email..." : "Send test email"}
            </button>
            <button
              type="button"
              onClick={() => void onSendTestNotification("discord")}
              disabled={testingDiscord || notificationSaving}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {testingDiscord ? "Sending Discord..." : "Send test Discord alert"}
            </button>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={notificationSaving || botConfigLoading}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {notificationSaving ? "Saving changes..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900">Custom domain</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Configure your public domain and verify DNS to prepare for launch.
        </p>
        <form className="mt-5 space-y-4" onSubmit={onDomainSave}>
          <div>
            <label
              htmlFor="status-page-slug"
              className="mb-1 block text-sm font-medium text-zinc-700"
            >
              Status page slug
            </label>
            <input
              id="status-page-slug"
              value={statusPageSlug}
              onChange={(event) => setStatusPageSlug(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              placeholder="main-status-page"
            />
          </div>
          <div>
            <label
              htmlFor="custom-domain"
              className="mb-1 block text-sm font-medium text-zinc-700"
            >
              Custom domain
            </label>
            <input
              id="custom-domain"
              value={customDomain}
              onChange={(event) => setCustomDomain(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              placeholder="status.yourcompany.com"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Current verification status: {workspace.domainSettings.customDomainStatus}.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void onVerifyDomain()}
              disabled={isVerifyingDomain}
              className="mr-2 inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isVerifyingDomain ? "Verifying..." : "Verify domain"}
            </button>
            <button
              type="submit"
              disabled={domainSaving}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {domainSaving ? "Saving..." : "Save domain settings"}
            </button>
          </div>
        </form>
        <p className="mt-3 text-xs text-zinc-500">
          DNS setup: create a CNAME record from your custom domain to your deployment domain.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900">Maintenance settings</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Plan maintenance windows to reduce false incident noise during planned work.
        </p>
        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={onCreateMaintenance}>
          <input
            value={maintenanceTitle}
            onChange={(event) => setMaintenanceTitle(event.target.value)}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            placeholder="Maintenance title"
          />
          <input
            value={maintenanceDescription}
            onChange={(event) => setMaintenanceDescription(event.target.value)}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            placeholder="Description (optional)"
          />
          <input
            type="datetime-local"
            value={maintenanceStartsAt}
            onChange={(event) => setMaintenanceStartsAt(event.target.value)}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
          />
          <input
            type="datetime-local"
            value={maintenanceEndsAt}
            onChange={(event) => setMaintenanceEndsAt(event.target.value)}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
          />
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={maintenanceSaving}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              {maintenanceSaving ? "Creating..." : "Create maintenance window"}
            </button>
          </div>
        </form>
        <div className="mt-4 space-y-2">
          {maintenanceWindows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
              No maintenance windows yet. Add one when you plan scheduled work.
            </div>
          ) : (
            maintenanceWindows.slice(0, 5).map((window) => (
              <div
                key={window.id}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
              >
                <p className="font-medium">{window.title}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(window.startsAt).toLocaleString()} - {new Date(window.endsAt).toLocaleString()} ({window.status})
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900">Plan info</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Your current plan and available monitoring capacity.
        </p>
        <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Free plan</p>
              <p className="mt-1 text-xs text-zinc-500">
                Suitable for early-stage projects and testing.
              </p>
            </div>
            <span className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700">
              Active
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900">Deployment readiness</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Your setup is compatible with branded domains such as `app.yourdomain.com` and
          `status.yourdomain.com`.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-700">
          <li>- Keep your status page slug stable before launch.</li>
          <li>- Point your custom status CNAME to your deployment host.</li>
          <li>- Add support email and alert email so users can reach your team quickly.</li>
        </ul>
      </section>
    </div>
  );
}
