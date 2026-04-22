"use client";

import { type FormEvent, useState } from "react";
import type { Service } from "@/lib/models/monitoring";
import { useAppData } from "@/state/app-data-provider";

type EditFormState = {
  name: string;
  url: string;
  checkType: Service["checkType"];
  checkInterval: string;
  timeoutMs: number;
  failureThreshold: number;
  retryCount: number;
  description: string;
};

type ServiceEditDialogProps = {
  service: Service;
  onClose: () => void;
};

export function serviceToFormState(service: Service): EditFormState {
  return {
    name: service.name,
    url: service.url,
    checkType: service.checkType === "api" ? "http" : service.checkType,
    checkInterval: service.checkInterval,
    timeoutMs: service.timeoutMs,
    failureThreshold: service.failureThreshold,
    retryCount: service.retryCount,
    description: service.description ?? "",
  };
}

export function ServiceEditDialog({ service, onClose }: ServiceEditDialogProps) {
  const { updateService } = useAppData();
  const [form, setForm] = useState<EditFormState>(() => serviceToFormState(service));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.url.trim() || !form.checkInterval.trim()) {
      setErrorMessage("Name, URL, and check interval are required.");
      return;
    }
    try {
      new URL(form.url);
    } catch {
      setErrorMessage("Enter a valid URL including https://.");
      return;
    }

    try {
      setIsSaving(true);
      await updateService({
        id: service.id,
        name: form.name,
        url: form.url,
        checkType: form.checkType === "api" ? "http" : form.checkType,
        checkInterval: form.checkInterval,
        timeoutMs: form.timeoutMs,
        failureThreshold: form.failureThreshold,
        retryCount: form.retryCount,
        description: form.description || undefined,
        isPublished: service.isPublished,
      });
      onClose();
    } catch (error) {
      console.error("[ServiceEditDialog] save failed", error);
      setErrorMessage("Could not save service changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close edit service dialog"
      />
      <section className="relative z-10 w-full max-w-xl rounded-2xl border border-white/10 bg-[#12141a] p-6 text-zinc-100 shadow-2xl">
        <h3 className="text-xl font-semibold">Edit monitor</h3>
        <p className="mt-1 text-sm text-zinc-400">Update this endpoint&rsquo;s check settings.</p>
        {errorMessage ? (
          <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {errorMessage}
          </div>
        ) : null}
        <form className="mt-4 space-y-4" onSubmit={handleSave}>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Name</label>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none ring-violet-500/40 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">URL</label>
            <input
              value={form.url}
              onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none ring-violet-500/40 focus:ring-2"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">Check type</label>
              <select
                value={form.checkType === "api" ? "http" : form.checkType}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    checkType: event.target.value as Service["checkType"],
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-violet-500/40"
              >
                <option value="http">HTTP / HTTPS</option>
                <option value="ping">Ping (HTTP GET)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">Interval</label>
              <input
                value={form.checkInterval}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, checkInterval: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-violet-500/40"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">Timeout (ms)</label>
              <input
                type="number"
                min={1000}
                value={form.timeoutMs}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    timeoutMs: Number(event.target.value || 10000),
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-violet-500/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">Fail threshold</label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.failureThreshold}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    failureThreshold: Number(event.target.value || 3),
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-violet-500/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">Retries</label>
              <input
                type="number"
                min={0}
                max={5}
                value={form.retryCount}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, retryCount: Number(event.target.value || 0) }))
                }
                className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-violet-500/40"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              className="min-h-24 w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/5 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-xl border border-white/10 px-4 text-sm font-medium text-zinc-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-10 items-center rounded-xl bg-violet-600 px-4 text-sm font-medium text-white shadow-lg shadow-violet-900/20 hover:bg-violet-500 disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
