"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { Service } from "@/lib/models/monitoring";
import { formatServiceResponse } from "@/lib/utils/monitoring-display";
import { formatTimestampOrText } from "@/lib/utils/date-time";
import { StatusBadge } from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
import { useAppData } from "@/state/app-data-provider";

type ServicesTableProps = {
  services: Service[];
};

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

function formatCheckType(checkType: Service["checkType"]): string {
  return checkType.toUpperCase();
}

export function ServicesTable({ services }: ServicesTableProps) {
  const { updateService, deleteService } = useAppData();
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [form, setForm] = useState<EditFormState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

  const editingService = useMemo(
    () => services.find((service) => service.id === editingServiceId) ?? null,
    [editingServiceId, services],
  );

  const openEdit = (service: Service) => {
    setEditingServiceId(service.id);
    setForm({
      name: service.name,
      url: service.url,
      checkType: service.checkType,
      checkInterval: service.checkInterval,
      timeoutMs: service.timeoutMs,
      failureThreshold: service.failureThreshold,
      retryCount: service.retryCount,
      description: service.description ?? "",
    });
    setErrorMessage(null);
  };

  const closeEdit = () => {
    setEditingServiceId(null);
    setForm(null);
    setErrorMessage(null);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingServiceId || !form) {
      return;
    }

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
        id: editingServiceId,
        name: form.name,
        url: form.url,
        checkType: form.checkType,
        checkInterval: form.checkInterval,
        timeoutMs: form.timeoutMs,
        failureThreshold: form.failureThreshold,
        retryCount: form.retryCount,
        description: form.description || undefined,
      });
      closeEdit();
    } catch (error) {
      console.error("[ServicesTable] edit failed", error);
      setErrorMessage("Could not save service changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    const shouldDelete = window.confirm(
      "Delete this service? This will remove it from monitoring and status views.",
    );
    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingServiceId(serviceId);
      await deleteService(serviceId);
    } catch (error) {
      console.error("[ServicesTable] delete failed", error);
      setErrorMessage("Could not delete service. Please try again.");
    } finally {
      setDeletingServiceId(null);
    }
  };

  const handleTogglePublished = async (service: Service, nextIsPublished: boolean) => {
    try {
      setErrorMessage(null);
      await updateService({
        id: service.id,
        name: service.name,
        url: service.url,
        checkType: service.checkType,
        checkInterval: service.checkInterval,
        timeoutMs: service.timeoutMs,
        failureThreshold: service.failureThreshold,
        retryCount: service.retryCount,
        description: service.description,
        isPublished: nextIsPublished,
      });
    } catch (error) {
      console.error("[ServicesTable] publish toggle failed", error);
      setErrorMessage("Could not update visibility on status page. Please try again.");
    }
  };

  return (
    <>
      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}
      <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm lg:block">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Interval</th>
              <th className="px-4 py-3 font-medium">Timeout</th>
              <th className="px-4 py-3 font-medium">Failures</th>
              <th className="px-4 py-3 font-medium">Last Checked</th>
              <th className="px-4 py-3 font-medium">Response</th>
              <th className="px-4 py-3 font-medium">
                <span className="block">Visibility</span>
                <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-zinc-400">
                  Public page
                </span>
              </th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-t border-zinc-100">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900">{service.name}</p>
                  <p className="text-xs text-zinc-500">{service.url}</p>
                  {service.description && (
                    <p className="mt-1 text-xs text-zinc-500">{service.description}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge value={service.status} />
                </td>
                <td className="px-4 py-3 text-zinc-600">{formatCheckType(service.checkType)}</td>
                <td className="px-4 py-3 text-zinc-600">{service.checkInterval}</td>
                <td className="px-4 py-3 text-zinc-600">{service.timeoutMs} ms</td>
                <td className="px-4 py-3 text-zinc-600">{service.failureThreshold}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatTimestampOrText(service.lastChecked)}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatServiceResponse({
                    status: service.status,
                    responseTimeMs: service.responseTimeMs,
                    lastChecked: service.lastChecked,
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <Switch
                      checked={service.isPublished}
                      onCheckedChange={(next) => void handleTogglePublished(service, next)}
                      aria-label={`Public visibility for ${service.name}`}
                    />
                    <div>
                      <p className="text-xs font-medium text-zinc-800">Public page</p>
                      <p className="mt-0.5 max-w-[11rem] text-[10px] leading-tight text-zinc-400">
                        {service.isPublished ? "Visible to visitors" : "Hidden—still monitored"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(service)}
                      className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(service.id)}
                      disabled={deletingServiceId === service.id}
                      className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                    >
                      {deletingServiceId === service.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {services.map((service) => (
          <article
            key={service.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-zinc-900">{service.name}</p>
                <p className="text-sm text-zinc-500">{service.url}</p>
              </div>
              <StatusBadge value={service.status} />
            </div>

            {service.description && (
              <p className="mt-3 text-sm text-zinc-600">{service.description}</p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600">
              <p>Type: {formatCheckType(service.checkType)}</p>
              <p>Interval: {service.checkInterval}</p>
              <p>Timeout: {service.timeoutMs} ms</p>
              <p>Threshold: {service.failureThreshold} fails</p>
              <p>Checked: {formatTimestampOrText(service.lastChecked)}</p>
              <p>
                Response:{" "}
                {formatServiceResponse({
                  status: service.status,
                  responseTimeMs: service.responseTimeMs,
                  lastChecked: service.lastChecked,
                })}
              </p>
            </div>

            <div className="mt-3 flex items-start gap-3">
              <Switch
                checked={service.isPublished}
                onCheckedChange={(next) => void handleTogglePublished(service, next)}
                aria-label={`Public visibility for ${service.name}`}
              />
              <div>
                <p className="text-xs font-medium text-zinc-800">Public page</p>
                <p className="mt-0.5 text-[10px] text-zinc-400">
                  {service.isPublished ? "Visible to visitors" : "Hidden—still monitored"}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => openEdit(service)}
                className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(service.id)}
                disabled={deletingServiceId === service.id}
                className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              >
                {deletingServiceId === service.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {editingService && form ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-900/45"
            onClick={closeEdit}
            aria-label="Close edit service modal"
          />
          <section className="relative z-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-zinc-900">Edit Service</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Update monitor details for this endpoint.
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleSave}>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Service name</label>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                  }
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">URL</label>
                <input
                  value={form.url}
                  onChange={(event) =>
                    setForm((prev) => (prev ? { ...prev, url: event.target.value } : prev))
                  }
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Check type</label>
                  <select
                    value={form.checkType}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              checkType: event.target.value as Service["checkType"],
                            }
                          : prev,
                      )
                    }
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2"
                  >
                    <option value="http">HTTP</option>
                    <option value="ping">Ping</option>
                    <option value="api">API</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Check interval</label>
                  <input
                    value={form.checkInterval}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, checkInterval: event.target.value } : prev,
                      )
                    }
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Timeout (ms)</label>
                  <input
                    type="number"
                    min={1000}
                    value={form.timeoutMs}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, timeoutMs: Number(event.target.value || 10000) } : prev,
                      )
                    }
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">
                    Failure threshold
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.failureThreshold}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, failureThreshold: Number(event.target.value || 3) }
                          : prev,
                      )
                    }
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Retry count</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={form.retryCount}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, retryCount: Number(event.target.value || 0) } : prev,
                      )
                    }
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Description (optional)
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) =>
                      prev ? { ...prev, description: event.target.value } : prev,
                    )
                  }
                  className="min-h-24 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="inline-flex h-10 items-center rounded-xl border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-10 items-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
