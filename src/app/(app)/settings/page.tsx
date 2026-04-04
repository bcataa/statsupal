"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { toSlug } from "@/lib/utils/slug";
import { useAppData } from "@/state/app-data-provider";

type SaveState = {
  tone: "success" | "error";
  message: string;
} | null;

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
  const [domainSaving, setDomainSaving] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>(null);
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false);
  const [maintenanceTitle, setMaintenanceTitle] = useState("");
  const [maintenanceDescription, setMaintenanceDescription] = useState("");
  const [maintenanceStartsAt, setMaintenanceStartsAt] = useState("");
  const [maintenanceEndsAt, setMaintenanceEndsAt] = useState("");
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
    setSaveState(null);

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
      setOnboardingState({ alertsConfigured: incidentAlerts });
      setSaveState({
        tone: "success",
        message: "Notification preferences saved, including Discord webhook settings.",
      });
    } catch (error) {
      console.error("[Settings] notification save failed", error);
      setSaveState({
        tone: "error",
        message: "Could not save notification preferences. Please try again.",
      });
    } finally {
      setNotificationSaving(false);
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
            ? "Custom domain saved. Verification support is coming soon."
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
              Discord webhook URL
            </label>
            <input
              id="discord-webhook"
              value={discordWebhookUrl}
              onChange={(event) => setDiscordWebhookUrl(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              placeholder="https://discord.com/api/webhooks/..."
            />
            <p className="mt-1 text-xs text-zinc-500">
              Used for automated incident and recovery notifications.
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
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={notificationSaving}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {notificationSaving ? "Saving..." : "Save notification preferences"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900">Custom domain</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Prepare your public status page branding with domain settings. Verification rollout is
          coming soon.
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
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Create maintenance window
            </button>
          </div>
        </form>
        <div className="mt-4 space-y-2">
          {maintenanceWindows.slice(0, 5).map((window) => (
            <div
              key={window.id}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
            >
              <p className="font-medium">{window.title}</p>
              <p className="text-xs text-zinc-500">
                {new Date(window.startsAt).toLocaleString()} - {new Date(window.endsAt).toLocaleString()} ({window.status})
              </p>
            </div>
          ))}
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
    </div>
  );
}
