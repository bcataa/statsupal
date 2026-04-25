"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEventHandler } from "react";
import { StatusPageLivePreview } from "@/components/status/status-page-live-preview";
import { DEFAULT_STATUS_PAGE_EXTRA } from "@/lib/models/status-page-theme";
import { useAppData } from "@/state/app-data-provider";
import { toSlug } from "@/lib/utils/slug";
import type { PublicOverallStatus } from "@/components/status/status-page-preview-helpers";
import type { ServiceStatus } from "@/lib/models/monitoring";

const DEFAULT_BRAND = "#10161f";
const DEFAULT_OPS = "#00b093";
const MAX_IMAGE_CHARS = 900_000;

type PreviewMode = "ok" | "degraded" | "down" | "pending";

function previewMapping(mode: PreviewMode): {
  overallPublic: PublicOverallStatus;
  overallStatus: ServiceStatus | "sample";
} {
  if (mode === "ok") {
    return { overallPublic: "all-operational", overallStatus: "operational" };
  }
  if (mode === "down") {
    return { overallPublic: "major-outage", overallStatus: "down" };
  }
  if (mode === "pending") {
    return { overallPublic: "partial-outage", overallStatus: "pending" };
  }
  return { overallPublic: "partial-outage", overallStatus: "degraded" };
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-[11px] font-medium text-zinc-500">
      {label}
      <div className="mt-1.5 flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border border-white/10 bg-zinc-900"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-zinc-950/80 px-2.5 py-2 font-mono text-xs text-zinc-200"
        />
      </div>
    </label>
  );
}

export default function StatusDesignSettingsPage() {
  const { workspace, isHydrated, updateWorkspaceInfo, services } = useAppData();
  const logoFileRef = useRef<HTMLInputElement>(null);
  const logoDarkFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);
  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND);
  const [operationalColor, setOperationalColor] = useState(DEFAULT_OPS);
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [logoDarkUrl, setLogoDarkUrl] = useState<string | undefined>();
  const [faviconUrl, setFaviconUrl] = useState<string | undefined>();
  const [published, setPublished] = useState(true);
  const [degradedColor, setDegradedColor] = useState(DEFAULT_STATUS_PAGE_EXTRA.degradedColor);
  const [partialOutageColor, setPartialOutageColor] = useState(
    DEFAULT_STATUS_PAGE_EXTRA.partialOutageColor,
  );
  const [majorOutageColor, setMajorOutageColor] = useState(DEFAULT_STATUS_PAGE_EXTRA.majorOutageColor);
  const [maintenanceColor, setMaintenanceColor] = useState(DEFAULT_STATUS_PAGE_EXTRA.maintenanceColor);
  const [notStartedColor, setNotStartedColor] = useState(DEFAULT_STATUS_PAGE_EXTRA.notStartedColor);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("ok");
  const [saveHint, setSaveHint] = useState<string | null>(null);

  // Sync form when app data finishes loading from Supabase (external source of truth).
  useEffect(() => {
    if (!isHydrated) return;
    const d = workspace.statusPage.design;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate form from workspace row
    setBrandColor(d.brandColor || DEFAULT_BRAND);
    setOperationalColor(d.operationalColor || DEFAULT_OPS);
    setLogoUrl(d.logoUrl);
    setLogoDarkUrl(d.logoDarkUrl);
    setFaviconUrl(d.faviconUrl);
    setPublished(workspace.statusPage.published);
    setDegradedColor(d.degradedColor || DEFAULT_STATUS_PAGE_EXTRA.degradedColor);
    setPartialOutageColor(d.partialOutageColor || DEFAULT_STATUS_PAGE_EXTRA.partialOutageColor);
    setMajorOutageColor(d.majorOutageColor || DEFAULT_STATUS_PAGE_EXTRA.majorOutageColor);
    setMaintenanceColor(d.maintenanceColor || DEFAULT_STATUS_PAGE_EXTRA.maintenanceColor);
    setNotStartedColor(d.notStartedColor || DEFAULT_STATUS_PAGE_EXTRA.notStartedColor);
  }, [isHydrated, workspace]);

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

  const save = () => {
    setSaveHint(null);
    updateWorkspaceInfo({
      statusPage: {
        published,
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
    setSaveHint("Saved. Your public /status/… page will use these after the next load.");
  };

  const project = workspace.projects[0];
  const previewName = services[0]?.name || "Primary service";
  const previewServiceUrl = services[0]?.url || "https://example.com";
  const { overallPublic, overallStatus } = previewMapping(previewMode);
  const extraTheme = {
    logoDarkUrl,
    degradedColor,
    partialOutageColor,
    majorOutageColor,
    maintenanceColor,
    notStartedColor,
  };

  const onLogo: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) {
      setLogoUrl(undefined);
      return;
    }
    const data = await readFile(f);
    if (data.length > MAX_IMAGE_CHARS) {
      alert("Image too large—use a file under about 500KB.");
      return;
    }
    setLogoUrl(data);
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
      alert("Image too large—use a file under about 500KB.");
      return;
    }
    setLogoDarkUrl(data);
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
      alert("Icon too large—use a file under about 500KB.");
      return;
    }
    setFaviconUrl(data);
  };

  if (!isHydrated) {
    return (
      <div className="mx-auto w-full max-w-3xl py-12 text-center text-sm text-zinc-500">Loading…</div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-16">
      <div>
        <Link
          href="/settings"
          className="text-xs font-semibold uppercase tracking-wide text-cyan-400/90 hover:text-cyan-300"
        >
          ← Settings
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-100">Status page customization</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Branding and status colors apply to your public <span className="text-zinc-300">/status/…</span> page
          and this live preview. Run the new Supabase migration if colors don’t persist (
          <code className="text-zinc-400">status_page_extra_theme</code>).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-8 rounded-2xl border border-white/10 bg-[#0a0a0c] p-5 sm:p-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-900"
            />
            Publish status page (public URL visible)
          </label>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Your brand</p>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {(
                [
                  {
                    label: "Logo",
                    val: logoUrl,
                    ref: logoFileRef,
                    on: onLogo,
                    accept: "image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml",
                  },
                  {
                    label: "Logo (dark mode)",
                    val: logoDarkUrl,
                    ref: logoDarkFileRef,
                    on: onLogoDark,
                    accept: "image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml",
                  },
                  {
                    label: "Favicon",
                    val: faviconUrl,
                    ref: faviconFileRef,
                    on: onFavicon,
                    accept: "image/png,image/jpeg,image/x-icon,image/vnd.microsoft.icon",
                  },
                ] as const
              ).map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-medium text-zinc-500">{item.label}</p>
                  <div className="mt-1 flex min-h-[3.5rem] items-center gap-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/15 bg-zinc-950/80">
                      {item.val ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.val} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-zinc-600">None</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="min-h-11 rounded-lg border border-white/15 bg-zinc-900/80 px-4 text-xs font-bold uppercase tracking-wide text-zinc-200 hover:bg-zinc-800"
                      onClick={() => item.ref.current?.click()}
                    >
                      {item.val ? "Change" : "Upload"}
                    </button>
                    <input
                      ref={item.ref}
                      type="file"
                      className="sr-only"
                      accept={item.accept}
                      onChange={item.on}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <ColorField label="Your brand color" value={brandColor} onChange={setBrandColor} />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Status colors</p>
            <p className="mt-1 text-xs text-zinc-600">Used for the public page banner, monitor rows, and charts.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ColorField
                label="Operational"
                value={operationalColor}
                onChange={setOperationalColor}
              />
              <ColorField label="Degraded performance" value={degradedColor} onChange={setDegradedColor} />
              <ColorField label="Partial outage" value={partialOutageColor} onChange={setPartialOutageColor} />
              <ColorField label="Major outage" value={majorOutageColor} onChange={setMajorOutageColor} />
              <ColorField label="Maintenance" value={maintenanceColor} onChange={setMaintenanceColor} />
              <ColorField
                label="Service not started / checking"
                value={notStartedColor}
                onChange={setNotStartedColor}
              />
            </div>
          </div>

          <div className="space-y-3">
            {saveHint ? <p className="text-sm text-emerald-400/90">{saveHint}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={save}
                className="inline-flex h-12 min-w-[8rem] items-center justify-center rounded-xl bg-white px-6 text-sm font-bold uppercase tracking-wide text-zinc-900 hover:bg-zinc-200"
              >
                Save
              </button>
              <Link
                href="/onboarding/wizard"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-medium text-zinc-300 hover:bg-white/5"
              >
                Full setup wizard
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Live preview</p>
            <p className="mt-1 text-xs text-zinc-600">Pick a scenario to see how your colors read on the page.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  { id: "ok" as const, label: "All operational" },
                  { id: "degraded" as const, label: "Degraded" },
                  { id: "down" as const, label: "Outage" },
                  { id: "pending" as const, label: "Checking" },
                ] as const
              ).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setPreviewMode(b.id)}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    previewMode === b.id
                      ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-200"
                      : "border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300",
                  ].join(" ")}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 ring-1 ring-violet-500/10">
            <StatusPageLivePreview
              pageTitle={project?.name || "Your status page"}
              slug={project?.slug ? toSlug(project.slug) : "your-page"}
              brandColor={brandColor}
              operationalColor={operationalColor}
              logoUrl={logoUrl}
              logoDarkUrl={logoDarkUrl}
              faviconUrl={faviconUrl}
              extraTheme={extraTheme}
              serviceUrl={previewServiceUrl}
              serviceName={previewName}
              overallStatus={overallStatus}
              overallPublic={overallPublic}
              isUnpublished={!published}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
