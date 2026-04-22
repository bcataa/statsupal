"use client";

import { useMemo, useState } from "react";
import type { Service } from "@/lib/models/monitoring";
import { formatServiceResponse } from "@/lib/utils/monitoring-display";
import { formatTimestampOrText } from "@/lib/utils/date-time";
import { ServiceEditDialog } from "@/components/services/service-edit-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
import { useAppData } from "@/state/app-data-provider";

type ServicesTableProps = {
  services: Service[];
};

function formatCheckType(checkType: Service["checkType"]): string {
  if (checkType === "api") return "HTTP";
  return checkType.toUpperCase();
}

export function ServicesTable({ services }: ServicesTableProps) {
  const { updateService, deleteService } = useAppData();
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

  const editingService = useMemo(
    () => services.find((service) => service.id === editingServiceId) ?? null,
    [editingServiceId, services],
  );

  const openEdit = (service: Service) => {
    setEditingServiceId(service.id);
    setErrorMessage(null);
  };

  const closeEdit = () => {
    setEditingServiceId(null);
    setErrorMessage(null);
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

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openEdit(service)}
                className="inline-flex min-h-10 min-w-[4.5rem] items-center justify-center rounded-xl border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(service.id)}
                disabled={deletingServiceId === service.id}
                className="inline-flex min-h-10 min-w-[4.5rem] items-center justify-center rounded-xl border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-60"
              >
                {deletingServiceId === service.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {editingService ? (
        <ServiceEditDialog key={editingService.id} service={editingService} onClose={closeEdit} />
      ) : null}
    </>
  );
}
