"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEventHandler,
} from "react";
import { StatusPageLivePreview } from "@/components/status/status-page-live-preview";
import {
  buildRecentNoticeLines,
  expandUptimeToBars,
  getPublicOverallStatus,
  uptimeLabelFromSummary,
} from "@/components/status/status-page-preview-helpers";
import { ServiceEditDialog } from "@/components/services/service-edit-dialog";
import { DEFAULT_STATUS_PAGE_EXTRA } from "@/lib/models/status-page-theme";
import { toSlug } from "@/lib/utils/slug";
import { resolveWorkspaceStatusSlug } from "@/lib/utils/status-slug";
import type { Service } from "@/lib/models/monitoring";
import { useAppData } from "@/state/app-data-provider";

const DEFAULT_BRAND = "#7c3aed";
const DEFAULT_OPS = "#00b069";
const MAX_IMAGE_CHARS = 900_000;

const TAB_LABELS = [
  { id: "overview" as const, label: "Overview" },
  { id: "components" as const, label: "Components" },
  { id: "settings" as const, label: "Settings" },
  { id: "customize" as const, label: "Customize" },
  { id: "subscribers" as const, label: "Subscribers" },
  { id: "widget" as const, label: "Widget" },
  { id: "metrics" as const, label: "Metrics" },
] as const;

type TabId = (typeof TAB_LABELS)[number]["id"];

const TAB_SET = new Set<TabId>(TAB_LABELS.map((t) => t.id));

type StatusPageConsoleProps = {
  projectParam: string;
};

function isTabId(v: string | null | undefined): v is TabId {
  return Boolean(v && TAB_SET.has(v as TabId));
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  );
}

function buildPreviewServiceRows(list: Service[], publishedOnly: boolean) {
  const src = publishedOnly
    ? list.filter((s) => s.isPublished)
    : list;
  return src.map((s) => ({
    name: s.name,
    url: s.url,
    status: s.status,
    lastChecked: s.lastChecked,
    responseTimeMs: s.responseTimeMs,
  }));
}

function StatusPageConsoleBody({ projectParam }: StatusPageConsoleProps) {
  const {
    isHydrated,
    workspace,
    currentProject,
    services,
    incidents,
    alertSubscribers,
    uptimeSummary,
    updateWorkspaceInfo,
    updateService,
    refreshData,
  } = useAppData();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingDesign, setSavingDesign] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [settingsSaved, setSettingsSaved] = useState<string | null>(null);
  const [designSaveNote, setDesignSaveNote] = useState<string | null>(null);
  const [widgetCopy, setWidgetCopy] = useState<string | null>(null);
  const [embedOrigin, setEmbedOrigin] = useState("");

  const tabParam = searchParams.get("tab");
  const activeTab: TabId = isTabId(tabParam) ? tabParam : "overview";

  const setTab = useCallback(
    (next: TabId) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("tab", next);
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const logoFileRef = useRef<HTMLInputElement>(null);
  const logoDarkFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);
  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND);
  const [operationalColor, setOperationalColor] = useState(DEFAULT_OPS);
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [logoDarkUrl, setLogoDarkUrl] = useState<string | undefined>();
  const [faviconUrl, setFaviconUrl] = useState<string | undefined>();
  const [degradedColor, setDegradedColor] = useState(DEFAULT_STATUS_PAGE_EXTRA.degradedColor);
  const [partialOutageColor, setPartialOutageColor] = useState(
    DEFAULT_STATUS_PAGE_EXTRA.partialOutageColor,
  );
  const [majorOutageColor, setMajorOutageColor] = useState(DEFAULT_STATUS_PAGE_EXTRA.majorOutageColor);
  const [maintenanceColor, setMaintenanceColor] = useState(DEFAULT_STATUS_PAGE_EXTRA.maintenanceColor);
  const [notStartedColor, setNotStartedColor] = useState(DEFAULT_STATUS_PAGE_EXTRA.notStartedColor);
  const [customizePublished, setCustomizePublished] = useState(true);

  const [workspaceName, setWorkspaceName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [statusPageSlug, setStatusPageSlug] = useState("");
  const [publicDescription, setPublicDescription] = useState("");
  const [supportEmail, setSupportEmail] = useState("");

  const publicSlug = useMemo(
    () => resolveWorkspaceStatusSlug(workspace, currentProject),
    [workspace, currentProject],
  );
  const publicPath = useMemo(
    () => `/status/${encodeURIComponent(publicSlug)}`,
    [publicSlug],
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    setBrandColor(workspace.statusPage.design.brandColor || DEFAULT_BRAND);
    setOperationalColor(workspace.statusPage.design.operationalColor || DEFAULT_OPS);
    setLogoUrl(workspace.statusPage.design.logoUrl);
    setLogoDarkUrl(workspace.statusPage.design.logoDarkUrl);
    setFaviconUrl(workspace.statusPage.design.faviconUrl);
    const d = workspace.statusPage.design;
    setDegradedColor(d.degradedColor || DEFAULT_STATUS_PAGE_EXTRA.degradedColor);
    setPartialOutageColor(d.partialOutageColor || DEFAULT_STATUS_PAGE_EXTRA.partialOutageColor);
    setMajorOutageColor(d.majorOutageColor || DEFAULT_STATUS_PAGE_EXTRA.majorOutageColor);
    setMaintenanceColor(d.maintenanceColor || DEFAULT_STATUS_PAGE_EXTRA.maintenanceColor);
    setNotStartedColor(d.notStartedColor || DEFAULT_STATUS_PAGE_EXTRA.notStartedColor);
    setCustomizePublished(workspace.statusPage.published);
    setWorkspaceName(workspace.name);
    setProjectName(currentProject?.name || "");
    setStatusPageSlug(currentProject?.slug || "");
    setPublicDescription(workspace.publicDescription || "");
    setSupportEmail(workspace.notificationSettings.supportEmail || "");
  }, [isHydrated, workspace, currentProject]);

  useEffect(() => {
    setEmbedOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  };

  const readFile = (file: File | null): Promise<string> =>
    new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = () => reject(new Error("read failed"));
      r.readAsDataURL(file);
    });

  const onLogo: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) {
      setLogoUrl(undefined);
      return;
    }
    const data = await readFile(f);
    if (data.length > MAX_IMAGE_CHARS) {
      window.alert("Image too large—use a file under about 500KB.");
      return;
    }
    setLogoUrl(data);
  };

  const onFavicon: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) {
      setFaviconUrl(undefined);
      return;
    }
    const data = await readFile(f);
    if (data.length > MAX_IMAGE_CHARS) {
      window.alert("Icon too large—use a file under about 500KB.");
      return;
    }
    setFaviconUrl(data);
  };

  const onLogoDark: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) {
      setLogoDarkUrl(undefined);
      return;
    }
    const data = await readFile(f);
    if (data.length > MAX_IMAGE_CHARS) {
      window.alert("Image too large—use a file under about 500KB.");
      return;
    }
    setLogoDarkUrl(data);
  };

  const saveDesign = () => {
    setSavingDesign(true);
    setDesignSaveNote(null);
    try {
      updateWorkspaceInfo({
        statusPage: {
          published: customizePublished,
          design: {
            style: "premium_dark",
            brandColor,
            operationalColor,
            logoUrl,
            logoDarkUrl,
            faviconUrl,
            degradedColor,
            partialOutageColor,
            majorOutageColor,
            maintenanceColor,
            notStartedColor,
          },
        },
      });
      setDesignSaveNote("Design saved.");
      window.setTimeout(() => setDesignSaveNote(null), 3000);
    } finally {
      setSavingDesign(false);
    }
  };

  const savePageSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSettingsSaved(null);
    const wn = workspaceName.trim();
    const pn = projectName.trim();
    const sl = toSlug(statusPageSlug.trim() || pn || wn);
    if (!wn || !pn) {
      setSettingsSaved("Workspace name and project name are required.");
      setSaving(false);
      return;
    }
    updateWorkspaceInfo({
      workspaceName: wn,
      projectName: pn,
      projectSlug: sl,
      publicDescription: publicDescription.trim(),
      supportEmail: supportEmail.trim(),
    });
    setSettingsSaved("Saved.");
    if (sl && sl !== projectParam) {
      router.replace(`/dashboard/status/${encodeURIComponent(sl)}?tab=settings`, { scroll: false });
    }
    window.setTimeout(() => setSettingsSaved(null), 4000);
    setSaving(false);
  };

  const projectTitle =
    currentProject?.name?.trim() || workspace.projects[0]?.name?.trim() || "Status page";
  const pageTitleForPreview = projectTitle;

  const publishedServices = useMemo(
    () => services.filter((s) => s.isPublished),
    [services],
  );

  const overall = useMemo(
    () => getPublicOverallStatus(services),
    [services],
  );

  const barHeights = useMemo(
    () => expandUptimeToBars(uptimeSummary.points, 56),
    [uptimeSummary.points],
  );

  const uptimeLabel = useMemo(
    () => uptimeLabelFromSummary(uptimeSummary, services.length),
    [services.length, uptimeSummary],
  );

  const notices = useMemo(() => buildRecentNoticeLines(incidents), [incidents]);

  /** Saved workspace design — Overview reflects persisted data, not unsaved Customize drafts. */
  const committedDesign = useMemo(
    () => {
      const d = workspace.statusPage.design;
      return {
        brand: d.brandColor || DEFAULT_BRAND,
        op: d.operationalColor || DEFAULT_OPS,
        logo: d.logoUrl,
        logoDark: d.logoDarkUrl,
        fav: d.faviconUrl,
        extra: {
          degradedColor: d.degradedColor || DEFAULT_STATUS_PAGE_EXTRA.degradedColor,
          partialOutageColor: d.partialOutageColor || DEFAULT_STATUS_PAGE_EXTRA.partialOutageColor,
          majorOutageColor: d.majorOutageColor || DEFAULT_STATUS_PAGE_EXTRA.majorOutageColor,
          maintenanceColor: d.maintenanceColor || DEFAULT_STATUS_PAGE_EXTRA.maintenanceColor,
          notStartedColor: d.notStartedColor || DEFAULT_STATUS_PAGE_EXTRA.notStartedColor,
        },
      };
    },
    [workspace],
  );

  const primaryServiceName = services[0]?.name || "Primary service";
  const primaryServiceUrl = services[0]?.url || "https://example.com";

  const copyEmbed = async (snippet: string) => {
    try {
      await navigator.clipboard.writeText(snippet);
      setWidgetCopy("Copied to clipboard.");
      window.setTimeout(() => setWidgetCopy(null), 2500);
    } catch {
      setWidgetCopy("Copy failed—select the code manually.");
    }
  };

  if (!isHydrated) {
    return (
      <div className="mx-auto w-full max-w-5xl py-20 text-center text-sm text-zinc-500">
        Loading your status page…
      </div>
    );
  }

  const showSlugMismatch = projectParam && publicSlug && projectParam !== publicSlug;
  const embedCode =
    embedOrigin && publicSlug
      ? `<iframe title="Status" src="${embedOrigin}/status/${encodeURIComponent(publicSlug)}" width="100%" height="420" style="border:0;border-radius:12px" loading="lazy" />`
      : `<iframe title="Status" src="/status/<your-slug>" width="100%" height="420" style="border:0;border-radius:12px" loading="lazy" />`;

  return (
    <div className="mx-auto w-full max-w-5xl">
      {showSlugMismatch ? (
        <p className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          This URL uses a different slug than your workspace (
          <span className="font-mono text-amber-50">{publicSlug}</span>). The console shows your
          active workspace. Use the Visit button to open the real public page.
        </p>
      ) : null}
      <div
        className="rounded-[1.5rem] border border-white/[0.08] bg-zinc-900/35 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_50px_-24px_rgba(0,0,0,0.75)] sm:p-6 md:p-8"
        style={{ boxShadow: "0 0 80px -30px rgba(124, 58, 237, 0.15), inset 0 1px 0 rgba(255,255,255,0.04)" }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">
              Page · {pageTitleForPreview}
            </h1>
            <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
              Manage how your public status page looks, reads, and embeds. Changes sync to your
              workspace.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-white/[0.06] pt-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="scrollbar-thin -mx-1 flex min-w-0 flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {TAB_LABELS.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={[
                    "shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition",
                    active
                      ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-100 shadow-[0_0_20px_-8px_rgba(6,182,212,0.5)]"
                      : "border-transparent text-zinc-400 hover:border-white/10 hover:text-zinc-200",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:border-cyan-500/30 hover:text-white disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshIcon
                className={refreshing ? "animate-spin text-cyan-300" : "text-zinc-300"}
              />
            </button>
            <Link
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 text-sm font-medium text-emerald-100 shadow-[0_0_24px_-10px_rgba(16,185,129,0.45)] transition hover:border-emerald-400/50 hover:bg-emerald-500/15"
            >
              <span>Visit page</span>
              <ExternalLinkIcon className="shrink-0 text-emerald-200/90" />
            </Link>
          </div>
        </div>

        <div className="mt-8">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                This preview uses your workspace monitors, design colors, and recent incidents. It is
                an approximation of the public layout—use Visit page to confirm the live URL.
              </p>
              <StatusPageLivePreview
                pageTitle={pageTitleForPreview}
                slug={publicSlug}
                brandColor={committedDesign.brand}
                operationalColor={committedDesign.op}
                logoUrl={committedDesign.logo}
                logoDarkUrl={committedDesign.logoDark}
                extraTheme={committedDesign.extra}
                faviconUrl={committedDesign.fav}
                serviceName={primaryServiceName}
                serviceUrl={primaryServiceUrl}
                overallStatus="operational"
                overallPublic={overall}
                uptimeLabel={uptimeLabel}
                publicDescription={workspace.publicDescription}
                isUnpublished={!workspace.statusPage.published}
                notices={notices}
                previewServices={buildPreviewServiceRows(services, true)}
                barHeights={barHeights}
              />
            </div>
          )}

          {activeTab === "components" && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                Public components map to your monitors. Toggle visibility, then use Edit for advanced
                fields.
              </p>
              {services.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-zinc-950/40 p-6 text-sm text-zinc-500">
                  No services yet. Add a monitor to appear on the status page.
                </p>
              ) : (
                <ul className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/30">
                  {services.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-100">{s.name}</p>
                        <p className="text-xs text-zinc-500">{s.url}</p>
                        {s.description ? (
                          <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{s.description}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={[
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            s.status === "down"
                              ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                              : s.status === "degraded" || s.status === "pending"
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
                                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
                          ].join(" ")}
                        >
                          {s.status}
                        </span>
                        <label className="flex items-center gap-2 text-sm text-zinc-400">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-white/20 bg-zinc-900"
                            checked={s.isPublished}
                            onChange={(e) => {
                              void updateService({
                                id: s.id,
                                name: s.name,
                                url: s.url,
                                checkType: s.checkType,
                                checkInterval: s.checkInterval,
                                description: s.description,
                                isPublished: e.target.checked,
                                timeoutMs: s.timeoutMs,
                                failureThreshold: s.failureThreshold,
                                retryCount: s.retryCount,
                              });
                            }}
                          />
                          Public
                        </label>
                        <button
                          type="button"
                          onClick={() => setEditing(s)}
                          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-cyan-500/30 hover:text-white"
                        >
                          Edit
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <form
              onSubmit={savePageSettings}
              className="mx-auto max-w-xl space-y-5"
            >
              {settingsSaved ? (
                <p className="text-sm text-cyan-300/90">{settingsSaved}</p>
              ) : null}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-500">
                  Workspace name
                  <input
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none ring-0 focus:border-cyan-500/50"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-500">
                  Page / project name
                  <input
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-cyan-500/50"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-500">
                  Public URL slug
                  <input
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2.5 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-500/50"
                    value={statusPageSlug}
                    onChange={(e) => setStatusPageSlug(e.target.value)}
                    placeholder="my-product-status"
                  />
                </label>
                <p className="text-xs text-zinc-500">
                  Public URL: <span className="text-zinc-300">{publicPath || "/status/…"}</span>
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-500">
                  Short description
                  <textarea
                    className="mt-1.5 min-h-[88px] w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-cyan-500/50"
                    value={publicDescription}
                    onChange={(e) => setPublicDescription(e.target.value)}
                    placeholder="Shown to visitors on your public page."
                  />
                </label>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-500">
                  Support / contact email
                  <input
                    type="email"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-cyan-500/50"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="support@company.com"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-zinc-900"
                  checked={workspace.statusPage.published}
                  onChange={(e) => {
                    updateWorkspaceInfo({ statusPage: { published: e.target.checked } });
                  }}
                />
                Publish public status page
              </label>
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 min-w-[140px] items-center justify-center rounded-xl bg-cyan-600/80 px-5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save settings"}
                </button>
                <p className="mt-2 text-xs text-zinc-500">
                  Same data as the main settings page. Other notification toggles still live under{" "}
                  <Link
                    className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300"
                    href="/settings"
                  >
                    Settings
                  </Link>
                  .
                </p>
              </div>
            </form>
          )}

          {activeTab === "customize" && (
            <div className="space-y-6">
              <p className="text-sm text-zinc-400">
                Adjusts colors and assets for the premium public layout. Preview updates as you
                type—use Save to persist to your account.
              </p>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-zinc-900"
                  checked={customizePublished}
                  onChange={(e) => setCustomizePublished(e.target.checked)}
                />
                Publish to visitors (same as Settings)
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-medium text-zinc-500">
                  Logo
                  <input
                    ref={logoFileRef}
                    type="file"
                    accept="image/*"
                    className="mt-1 text-xs text-zinc-400"
                    onChange={onLogo}
                  />
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="mt-2 h-10 w-auto max-w-full rounded object-contain"
                    />
                  ) : null}
                </label>
                <label className="block text-xs font-medium text-zinc-500">
                  Logo (dark header)
                  <input
                    ref={logoDarkFileRef}
                    type="file"
                    accept="image/*"
                    className="mt-1 text-xs text-zinc-400"
                    onChange={onLogoDark}
                  />
                  {logoDarkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoDarkUrl}
                      alt="Dark mode logo"
                      className="mt-2 h-10 w-auto max-w-full rounded object-contain"
                    />
                  ) : null}
                </label>
                <label className="block text-xs font-medium text-zinc-500">
                  Favicon
                  <input
                    ref={faviconFileRef}
                    type="file"
                    accept="image/*"
                    className="mt-1 text-xs text-zinc-400"
                    onChange={onFavicon}
                  />
                </label>
                <label className="block text-xs font-medium text-zinc-500">
                  Brand color
                  <div className="mt-1 flex gap-2">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-11 w-14 cursor-pointer rounded-lg border border-white/10"
                    />
                    <input
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 font-mono text-sm text-zinc-100"
                    />
                  </div>
                </label>
                <label className="block text-xs font-medium text-zinc-500">
                  Operational color
                  <div className="mt-1 flex gap-2">
                    <input
                      type="color"
                      value={operationalColor}
                      onChange={(e) => setOperationalColor(e.target.value)}
                      className="h-11 w-14 cursor-pointer rounded-lg border border-white/10"
                    />
                    <input
                      value={operationalColor}
                      onChange={(e) => setOperationalColor(e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 font-mono text-sm text-zinc-100"
                    />
                  </div>
                </label>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 sm:col-span-2">
                  Other state colors
                </p>
                {(
                  [
                    ["Degraded", degradedColor, setDegradedColor] as const,
                    ["Partial outage", partialOutageColor, setPartialOutageColor] as const,
                    ["Major outage", majorOutageColor, setMajorOutageColor] as const,
                    ["Maintenance", maintenanceColor, setMaintenanceColor] as const,
                    ["Checking / not started", notStartedColor, setNotStartedColor] as const,
                  ] as const
                ).map(([label, value, set]) => (
                  <label key={label} className="block text-xs font-medium text-zinc-500">
                    {label}
                    <div className="mt-1 flex gap-2">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        className="h-10 w-12 cursor-pointer rounded-lg border border-white/10"
                      />
                      <input
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-zinc-950/60 px-2 py-1.5 font-mono text-xs text-zinc-100"
                      />
                    </div>
                  </label>
                ))}
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Live preview
                </p>
                <p className="mb-4 text-xs text-zinc-500">Updates instantly from the controls above.</p>
                <StatusPageLivePreview
                  pageTitle={pageTitleForPreview}
                  slug={publicSlug}
                  brandColor={brandColor}
                  operationalColor={operationalColor}
                  logoUrl={logoUrl}
                  logoDarkUrl={logoDarkUrl}
                  extraTheme={{
                    logoDarkUrl,
                    degradedColor,
                    partialOutageColor,
                    majorOutageColor,
                    maintenanceColor,
                    notStartedColor,
                  }}
                  faviconUrl={faviconUrl}
                  serviceName={primaryServiceName}
                  serviceUrl={primaryServiceUrl}
                  overallStatus="operational"
                  overallPublic={overall}
                  uptimeLabel={uptimeLabel}
                  publicDescription={workspace.publicDescription}
                  isUnpublished={!customizePublished}
                  notices={notices}
                  previewServices={buildPreviewServiceRows(services, true)}
                  barHeights={barHeights}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={saveDesign}
                  disabled={savingDesign}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-100 px-5 text-sm font-semibold text-zinc-900 hover:bg-white disabled:opacity-50"
                >
                  {savingDesign ? "Saving…" : "Save design"}
                </button>
                {designSaveNote ? <span className="text-sm text-emerald-400">{designSaveNote}</span> : null}
                <Link
                  href="/settings/status-design"
                  className="text-sm text-cyan-400/90 underline-offset-2 hover:underline"
                >
                  Open full design page
                </Link>
              </div>
            </div>
          )}

          {activeTab === "subscribers" && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                Email addresses subscribed to status updates from the app data store.
              </p>
              {alertSubscribers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 bg-zinc-950/30 p-8 text-center text-sm text-zinc-500">
                  No alert subscribers yet. When you collect emails from your status flows, they will
                  appear here.
                </div>
              ) : (
                <ul className="overflow-hidden rounded-xl border border-white/10">
                  {alertSubscribers.map((sub) => (
                    <li
                      key={sub.id}
                      className="flex flex-col gap-1 border-b border-white/5 px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="font-mono text-sm text-zinc-200">{sub.email}</span>
                      <span
                        className={[
                          "w-fit text-xs",
                          sub.active ? "text-emerald-400" : "text-zinc-500",
                        ].join(" ")}
                      >
                        {sub.active ? "Active" : "Inactive"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === "widget" && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Embed a read-only view of your public page in help centers or the product shell.
                Replace the host if you deploy under a custom domain.
              </p>
              {widgetCopy ? <p className="text-sm text-emerald-400">{widgetCopy}</p> : null}
              <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950/40 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-500">HTML embed</p>
                  <button
                    type="button"
                    onClick={() => void copyEmbed(embedCode)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-200 hover:border-cyan-500/30"
                  >
                    Copy
                  </button>
                </div>
                <pre className="max-h-40 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-all text-xs text-zinc-300">
                  {embedCode}
                </pre>
              </div>
              {embedOrigin && publicPath ? (
                <div className="overflow-hidden rounded-xl border border-white/10 p-0">
                  <p className="border-b border-white/10 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-500">
                    Thumbnail
                  </p>
                  <div className="h-[200px] w-full sm:h-[240px]">
                    <iframe
                      title="Widget preview"
                      src={`${embedOrigin}${publicPath}`}
                      className="h-full w-full border-0"
                      loading="lazy"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {activeTab === "metrics" && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Aggregated from your current workspace. Visit analytics are a roadmap item; only
                technical uptime aggregates are available today.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Monitors (total)", value: String(services.length) },
                  { label: "Public components", value: String(publishedServices.length) },
                  { label: "7-day average uptime", value: `${uptimeSummary.averageUptimePercentage.toFixed(1)}%` },
                  { label: "Open incidents", value: String(incidents.filter((i) => i.status !== "resolved").length) },
                  { label: "Alert subscribers", value: String(alertSubscribers.length) },
                  { label: "Page views (30d)", value: "— (not tracked yet)" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-white/10 bg-zinc-950/40 p-4"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {m.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-zinc-100">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {editing ? (
        <ServiceEditDialog
          key={editing.id}
          service={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

export function StatusPageConsole(props: StatusPageConsoleProps) {
  return <StatusPageConsoleBody {...props} />;
}
