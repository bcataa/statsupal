"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEventHandler,
} from "react";
import { StatusPageLivePreview } from "@/components/status/status-page-live-preview";
import type { CheckType } from "@/lib/models/monitoring";
import type { MonitorTestMonitorKind } from "@/lib/monitoring/monitor-test-kinds";
import { createClient } from "@/lib/supabase/client";
import { useAppData } from "@/state/app-data-provider";
import { toSlug } from "@/lib/utils/slug";

const DEFAULT_BRAND = "#7c3aed";
const DEFAULT_OPS = "#00b069";
const MAX_IMAGE_CHARS = 900_000;

type WizardKind = MonitorTestMonitorKind;

const MONITOR_OPTIONS: {
  id: WizardKind;
  label: string;
  hint: string;
  accent: string;
}[] = [
  { id: "website", label: "Website", hint: "HTTP checks on any public URL", accent: "bg-sky-500/90" },
  { id: "cron", label: "Cron / heartbeat", hint: "Ping a URL on your schedule", accent: "bg-amber-500/90" },
  { id: "ping", label: "Ping", hint: "Reachability via HTTP GET", accent: "bg-pink-500/90" },
  { id: "tcp", label: "TCP", hint: "Use an HTTP health URL for now", accent: "bg-teal-600/90" },
  { id: "udp", label: "UDP", hint: "Use an HTTP health URL for now", accent: "bg-indigo-600/90" },
  { id: "dns", label: "DNS", hint: "Use an HTTP health URL for now", accent: "bg-zinc-500/90" },
];

function mapKindToCheckType(kind: WizardKind): CheckType {
  if (kind === "ping") return "ping";
  return "http";
}

function guessServiceName(url: string): string {
  try {
    const u = url.trim();
    if (!u) return "Primary service";
    const withProto = /^https?:\/\//i.test(u) ? u : `https://${u}`;
    return new URL(withProto).hostname || "Primary service";
  } catch {
    return "Primary service";
  }
}

type TestState =
  | { status: "idle" }
  | { status: "running" }
  | {
      status: "done";
      ok: boolean;
      message: string;
      responseTimeMs?: number;
      mapped?: string;
    };

export function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const {
    isHydrated,
    workspace,
    updateWorkspaceInfo,
    addService,
    updateService,
    services,
  } = useAppData();

  const [step, setStep] = useState(1);
  const [kind, setKind] = useState<WizardKind>("website");
  const [endpoint, setEndpoint] = useState("");
  const [test, setTest] = useState<TestState>({ status: "idle" });
  const [draftServiceId, setDraftServiceId] = useState<string | null>(null);
  const [pageName, setPageName] = useState("");
  const [slug, setSlug] = useState("");
  const [publish, setPublish] = useState(true);
  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND);
  const [operationalColor, setOperationalColor] = useState(DEFAULT_OPS);
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [faviconUrl, setFaviconUrl] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isHydrated) return;
    const q = searchParams.get("step");
    if (q) {
      const n = Number(q);
      if (n >= 1 && n <= 5) {
        setStep(n);
        return;
      }
    }
    const persisted = workspace.statusPage.onboardingWizardStep;
    if (persisted >= 1 && persisted <= 5) setStep(persisted);
    else if (persisted >= 6) setStep(5);
  }, [isHydrated, searchParams, workspace.statusPage.onboardingWizardStep]);

  useEffect(() => {
    if (!isHydrated) return;
    setPageName((p) => p || workspace.projects[0]?.name || "");
    setSlug((s) => s || workspace.projects[0]?.slug || "");
    setPublish(workspace.statusPage.published);
    setBrandColor(workspace.statusPage.design.brandColor || DEFAULT_BRAND);
    setOperationalColor(workspace.statusPage.design.operationalColor || DEFAULT_OPS);
    setLogoUrl(workspace.statusPage.design.logoUrl);
    setFaviconUrl(workspace.statusPage.design.faviconUrl);
  }, [isHydrated, workspace]);

  const persistStep = useCallback(
    (n: number) => {
      updateWorkspaceInfo({ statusPage: { onboardingWizardStep: n } });
    },
    [updateWorkspaceInfo],
  );

  const runTest = async () => {
    setTest({ status: "running" });
    try {
      const res = await fetch("/api/monitor/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: endpoint, monitorKind: kind }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        status?: string;
        responseTimeMs?: number;
      };
      const ok = Boolean(data.ok);
      const mapped =
        data.status === "operational"
          ? "Operational"
          : data.status === "degraded"
            ? "Degraded"
            : data.status === "down"
              ? "Down"
              : "Unknown";
      setTest({
        status: "done",
        ok,
        message: data.message || (ok ? "Success" : "Check failed"),
        responseTimeMs: data.responseTimeMs,
        mapped: ok ? mapped : "Down",
      });
    } catch {
      setTest({
        status: "done",
        ok: false,
        message: "Something went wrong running the test. Try again.",
        mapped: "Down",
      });
    }
  };

  const readFileDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = () => reject(new Error("read failed"));
      r.readAsDataURL(file);
    });

  const onLogoPicked: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
      setLogoUrl(undefined);
      return;
    }
    const data = await readFileDataUrl(file);
    if (data.length > MAX_IMAGE_CHARS) {
      alert("That image is too large—use a file under about 500KB (PNG, JPG, or WebP).");
      return;
    }
    setLogoUrl(data);
  };

  const onFaviconPicked: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
      setFaviconUrl(undefined);
      return;
    }
    const data = await readFileDataUrl(file);
    if (data.length > MAX_IMAGE_CHARS) {
      alert("That icon is too large—use a file under about 500KB.");
      return;
    }
    setFaviconUrl(data);
  };

  const saveMonitorAndAdvance = async () => {
    if (test.status !== "done" || !test.ok) {
      alert("Run a successful test first, then continue.");
      return;
    }
    setBusy(true);
    try {
      const name = guessServiceName(endpoint);
      const raw = endpoint.trim();
      const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      const checkType = mapKindToCheckType(kind);
      if (draftServiceId) {
        await updateService({
          id: draftServiceId,
          name,
          url,
          checkType,
          checkInterval: "1 min",
        });
      } else {
        const id = await addService({
          name,
          url,
          checkType,
          checkInterval: "1 min",
        });
        setDraftServiceId(id);
      }
      const next = 3;
      setStep(next);
      persistStep(next);
    } finally {
      setBusy(false);
    }
  };

  const finishDesign = () => {
    updateWorkspaceInfo({
      projectName: pageName.trim() || workspace.projects[0]?.name,
      projectSlug: toSlug(slug.trim() || pageName.trim() || workspace.projects[0]?.slug || "status"),
      statusPage: {
        onboardingWizardStep: 5,
        published: publish,
        design: {
          style: "premium_dark",
          brandColor,
          operationalColor,
          logoUrl,
          faviconUrl,
        },
      },
    });
    setStep(5);
  };

  const completeWizard = async () => {
    setBusy(true);
    try {
      updateWorkspaceInfo({
        projectName: pageName.trim() || workspace.projects[0]?.name,
        projectSlug: toSlug(slug.trim() || pageName.trim() || workspace.projects[0]?.slug || "status"),
        statusPage: {
          onboardingWizardStep: 6,
          published: publish,
          design: {
            style: "premium_dark",
            brandColor,
            operationalColor,
            logoUrl,
            faviconUrl,
          },
        },
      });
      if (supabase) {
        await supabase.auth.updateUser({
          data: {
            onboarding_completed: true,
            status_page_name: pageName.trim(),
            status_page_slug: toSlug(slug.trim() || pageName.trim() || "status"),
          },
        });
      }
      router.push("/dashboard");
    } finally {
      setBusy(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-zinc-400">
        Loading…
      </div>
    );
  }

  const previewService = services[0];
  const previewName = previewService?.name || guessServiceName(endpoint) || "Your first service";
  const previewServiceUrl = (() => {
    const u = previewService?.url || endpoint.trim();
    if (!u) return "https://example.com";
    return /^https?:\/\//i.test(u) ? u : `https://${u}`;
  })();

  return (
    <div className="min-h-[calc(100vh-2.25rem)] bg-black px-3 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/40 bg-gradient-to-br from-cyan-400/30 to-violet-600/30 text-lg font-bold text-white">
            S
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-300/90">
            Step {step} of 5
          </p>
          <h1 className="mt-2 text-xl font-semibold uppercase tracking-wide text-white sm:text-2xl">
            {step === 1 && "Connect your first service"}
            {step === 2 && "Run a quick test"}
            {step === 3 && "Create your status page"}
            {step === 4 && "Customize your page"}
            {step === 5 && "You’re ready"}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {step === 1 && "Pick what you want to monitor—we’ll tailor the next questions."}
            {step === 2 && "Verify we can reach your endpoint before saving."}
            {step === 3 && "Name your page and choose a URL. Preview updates live."}
            {step === 4 && "Logo, favicon, and colors—see the card change instantly."}
            {step === 5 && "Here’s what we’ll keep an eye on for you."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-4 shadow-2xl sm:p-6">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-zinc-400">What are you monitoring?</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {MONITOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setKind(opt.id)}
                    className={[
                      "flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                      kind === opt.id
                        ? "border-white/30 bg-white/10"
                        : "border-white/10 bg-black/40 hover:border-white/20",
                    ].join(" ")}
                  >
                    <span className={`mt-0.5 h-9 w-9 shrink-0 rounded-lg ${opt.accent}`} />
                    <span>
                      <span className="block text-sm font-semibold">{opt.label}</span>
                      <span className="mt-0.5 block text-[11px] text-zinc-500">{opt.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-white text-sm font-bold uppercase tracking-wide text-black"
                onClick={() => {
                  setStep(2);
                  persistStep(2);
                }}
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-xs font-medium text-zinc-400">
                URL or host to monitor
                <input
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://your-site.com"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={runTest}
                  disabled={!endpoint.trim() || test.status === "running"}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-40"
                >
                  {test.status === "running" ? "Running…" : "Run test"}
                </button>
                {test.status === "done" && (
                  <div
                    className={[
                      "flex min-h-11 flex-1 flex-col justify-center rounded-xl border px-3 py-2 text-xs sm:flex-row sm:items-center sm:gap-3",
                      test.ok ? "border-emerald-500/40 bg-emerald-500/10" : "border-rose-500/40 bg-rose-500/10",
                    ].join(" ")}
                  >
                    <span className="font-semibold">{test.ok ? "Success" : "Needs attention"}</span>
                    {test.responseTimeMs != null ? (
                      <span className="text-zinc-300">{test.responseTimeMs} ms</span>
                    ) : null}
                    <span className="text-zinc-400">{test.mapped}</span>
                    <span className="text-zinc-300 sm:ml-auto">{test.message}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={busy}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-white text-sm font-bold uppercase tracking-wide text-black disabled:opacity-50"
                onClick={() => void saveMonitorAndAdvance()}
              >
                Save & continue
              </button>
              <button
                type="button"
                className="text-xs font-medium uppercase tracking-wide text-zinc-500"
                onClick={() => {
                  setStep(1);
                  persistStep(1);
                }}
              >
                Back
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <label className="block text-xs font-medium text-zinc-400">
                Status page name
                <input
                  value={pageName}
                  onChange={(e) => {
                    setPageName(e.target.value);
                    if (!slug || slug === toSlug(pageName)) {
                      setSlug(toSlug(e.target.value));
                    }
                  }}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-3 text-sm outline-none focus:border-cyan-400/50"
                />
              </label>
              <label className="block text-xs font-medium text-zinc-400">
                Subdomain slug
                <input
                  value={slug}
                  onChange={(e) => setSlug(toSlug(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-3 text-sm outline-none focus:border-cyan-400/50"
                />
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={publish}
                  onChange={(e) => setPublish(e.target.checked)}
                  className="h-4 w-4 rounded border-white/30"
                />
                Publish my status page (visitors can open the public link)
              </label>
              <div className="pt-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  How your page will look
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  This updates as you type. You can change logo and colors in the next step.
                </p>
                <StatusPageLivePreview
                  className="mt-4"
                  pageTitle={pageName || "Your status page"}
                  slug={slug || "your-page"}
                  brandColor={brandColor}
                  operationalColor={operationalColor}
                  logoUrl={logoUrl}
                  faviconUrl={faviconUrl}
                  serviceUrl={previewServiceUrl}
                  serviceName={previewName}
                  overallStatus="sample"
                />
              </div>
              <button
                type="button"
                className="flex h-12 w-full items-center justify-center rounded-xl bg-white text-sm font-bold uppercase tracking-wide text-black"
                onClick={() => {
                  updateWorkspaceInfo({
                    projectName: pageName.trim(),
                    projectSlug: toSlug(slug.trim() || pageName.trim() || "status"),
                    statusPage: {
                      published: publish,
                      onboardingWizardStep: 4,
                    },
                  });
                  setStep(4);
                  persistStep(4);
                }}
              >
                Continue
              </button>
              <button
                type="button"
                className="text-xs font-medium uppercase tracking-wide text-zinc-500"
                onClick={() => {
                  setStep(2);
                  persistStep(2);
                }}
              >
                Back
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <p className="text-xs text-zinc-500">
                Add your brand images (PNG, JPG, or WebP).{" "}
                <span className="text-zinc-400">If nothing opens, tap the button again—some browsers need that.</span>
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-zinc-400">Logo</p>
                  <div className="mt-1 flex min-h-[3.5rem] items-center gap-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/20 bg-zinc-900/80">
                      {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoUrl} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <span className="px-1 text-center text-[10px] text-zinc-600">None</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        className="min-h-11 rounded-lg border border-white/30 bg-white/5 px-4 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/10"
                        onClick={() => logoFileRef.current?.click()}
                      >
                        Change
                      </button>
                      <input
                        ref={logoFileRef}
                        type="file"
                        className="sr-only"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                        onChange={onLogoPicked}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400">Favicon</p>
                  <div className="mt-1 flex min-h-[3.5rem] items-center gap-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/20 bg-zinc-900/80">
                      {faviconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={faviconUrl} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <span className="px-1 text-center text-[10px] text-zinc-600">None</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        className="min-h-11 rounded-lg border border-white/30 bg-white/5 px-4 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/10"
                        onClick={() => faviconFileRef.current?.click()}
                      >
                        Change
                      </button>
                      <input
                        ref={faviconFileRef}
                        type="file"
                        className="sr-only"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/x-icon,image/vnd.microsoft.icon"
                        onChange={onFaviconPicked}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-zinc-400">
                  Brand color
                  <div className="mt-1 flex gap-2">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-11 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                    />
                    <input
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/50 px-3 py-2 font-mono text-sm outline-none"
                    />
                  </div>
                </label>
                <label className="block text-xs font-medium text-zinc-400">
                  Operational color
                  <div className="mt-1 flex gap-2">
                    <input
                      type="color"
                      value={operationalColor}
                      onChange={(e) => setOperationalColor(e.target.value)}
                      className="h-11 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                    />
                    <input
                      value={operationalColor}
                      onChange={(e) => setOperationalColor(e.target.value)}
                      className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/50 px-3 py-2 font-mono text-sm outline-none"
                    />
                  </div>
                </label>
              </div>
              <div className="border-t border-white/10 pt-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  How your public page will look
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Similar to a classic status page: headline, your monitor link, uptime strip, and notices.
                </p>
                <StatusPageLivePreview
                  className="mt-4"
                  pageTitle={pageName || "Your status page"}
                  slug={slug || "your-page"}
                  brandColor={brandColor}
                  operationalColor={operationalColor}
                  logoUrl={logoUrl}
                  faviconUrl={faviconUrl}
                  serviceUrl={previewServiceUrl}
                  serviceName={previewName}
                  overallStatus="sample"
                />
              </div>
              <button
                type="button"
                className="flex h-12 w-full items-center justify-center rounded-xl bg-white text-sm font-bold uppercase tracking-wide text-black"
                onClick={finishDesign}
              >
                Save design
              </button>
              <button
                type="button"
                className="text-xs font-medium uppercase tracking-wide text-zinc-500"
                onClick={() => {
                  setStep(3);
                  persistStep(3);
                }}
              >
                Back
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 text-sm">
              <ul className="space-y-2 rounded-xl border border-white/10 bg-black/40 p-4 text-zinc-300">
                <li>
                  <span className="text-zinc-500">Monitor: </span>
                  {MONITOR_OPTIONS.find((m) => m.id === kind)?.label} — {endpoint || "—"}
                </li>
                <li>
                  <span className="text-zinc-500">Status page: </span>
                  {pageName} ({slug})
                </li>
                <li>
                  <span className="text-zinc-500">Public link: </span>
                  <span className="break-all text-cyan-300/90">
                    {typeof window !== "undefined" ? window.location.origin : ""}/status/{slug}
                  </span>
                </li>
                <li>
                  <span className="text-zinc-500">Published: </span>
                  {publish ? "Yes" : "No (only you can preview in the app for now)"}
                </li>
              </ul>
              <button
                type="button"
                disabled={busy}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-white text-sm font-bold uppercase tracking-wide text-black disabled:opacity-50"
                onClick={() => void completeWizard()}
              >
                Go to dashboard
              </button>
              <button
                type="button"
                className="text-xs font-medium uppercase tracking-wide text-zinc-500"
                onClick={() => {
                  setStep(4);
                  persistStep(4);
                }}
              >
                Back
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
          <Link href="/dashboard" className="font-semibold uppercase tracking-wide hover:text-white">
            Skip for now
          </Link>
          <Link href="/settings/status-design" className="hover:text-white">
            Advanced design (Settings)
          </Link>
        </div>
      </div>
    </div>
  );
}
