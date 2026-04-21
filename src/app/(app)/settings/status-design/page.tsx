"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusPageLivePreview } from "@/components/status/status-page-live-preview";
import { useAppData } from "@/state/app-data-provider";
import { toSlug } from "@/lib/utils/slug";

const DEFAULT_BRAND = "#7c3aed";
const DEFAULT_OPS = "#00b069";
const MAX_IMAGE_CHARS = 380_000;

export default function StatusDesignSettingsPage() {
  const { workspace, isHydrated, updateWorkspaceInfo, services } = useAppData();
  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND);
  const [operationalColor, setOperationalColor] = useState(DEFAULT_OPS);
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [faviconUrl, setFaviconUrl] = useState<string | undefined>();
  const [published, setPublished] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;
    setBrandColor(workspace.statusPage.design.brandColor || DEFAULT_BRAND);
    setOperationalColor(workspace.statusPage.design.operationalColor || DEFAULT_OPS);
    setLogoUrl(workspace.statusPage.design.logoUrl);
    setFaviconUrl(workspace.statusPage.design.faviconUrl);
    setPublished(workspace.statusPage.published);
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
    updateWorkspaceInfo({
      statusPage: {
        published,
        design: {
          style: "premium_dark",
          brandColor,
          operationalColor,
          logoUrl,
          faviconUrl,
        },
      },
    });
  };

  const project = workspace.projects[0];
  const previewName = services[0]?.name || "Primary service";

  if (!isHydrated) {
    return (
      <div className="mx-auto w-full max-w-3xl py-12 text-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-12">
      <div>
        <Link
          href="/settings"
          className="text-xs font-semibold uppercase tracking-wide text-violet-700 hover:text-violet-900"
        >
          ← Settings
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">Status page design</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Preview updates live. This controls the premium public layout for your status page.
        </p>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300"
        />
        Publish status page (public URL is visible to visitors)
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-zinc-500">Logo</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-dashed border-zinc-300 bg-zinc-50">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] text-zinc-400">None</span>
              )}
            </div>
            <label className="inline-flex cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold hover:bg-zinc-50">
              Change
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) {
                    setLogoUrl(undefined);
                    return;
                  }
                  const data = await readFile(f);
                  if (data.length > MAX_IMAGE_CHARS) {
                    alert("Image too large—try a smaller file.");
                    return;
                  }
                  setLogoUrl(data);
                }}
              />
            </label>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">Favicon</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-dashed border-zinc-300 bg-zinc-50">
              {faviconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={faviconUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] text-zinc-400">None</span>
              )}
            </div>
            <label className="inline-flex cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold hover:bg-zinc-50">
              Change
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) {
                    setFaviconUrl(undefined);
                    return;
                  }
                  const data = await readFile(f);
                  if (data.length > MAX_IMAGE_CHARS) {
                    alert("Image too large—try a smaller file.");
                    return;
                  }
                  setFaviconUrl(data);
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-xs font-medium text-zinc-500">
          Brand color
          <div className="mt-1 flex gap-2">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="h-11 w-14 cursor-pointer rounded-lg border border-zinc-200"
            />
            <input
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm"
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
              className="h-11 w-14 cursor-pointer rounded-lg border border-zinc-200"
            />
            <input
              value={operationalColor}
              onChange={(e) => setOperationalColor(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm"
            />
          </div>
        </label>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-950 p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Live preview
        </p>
        <StatusPageLivePreview
          pageTitle={project?.name || "Your status page"}
          slug={project?.slug ? toSlug(project.slug) : "your-page"}
          brandColor={brandColor}
          operationalColor={operationalColor}
          logoUrl={logoUrl}
          serviceName={previewName}
          overallStatus="sample"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={save}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Save design
        </button>
        <Link
          href="/onboarding/wizard"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Full setup wizard
        </Link>
      </div>
    </div>
  );
}
