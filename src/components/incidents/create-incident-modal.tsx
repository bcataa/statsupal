"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { IncidentSeverity, IncidentStatus } from "@/lib/models/monitoring";
import { useAppData } from "@/state/app-data-provider";

type FormState = {
  title: string;
  affectedServiceId: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
};

type FormErrors = {
  title?: string;
  affectedServiceId?: string;
};

const defaultForm: FormState = {
  title: "",
  affectedServiceId: "",
  severity: "major",
  status: "investigating",
  description: "",
};

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.title.trim()) {
    errors.title = "Incident title is required.";
  }

  if (!form.affectedServiceId) {
    errors.affectedServiceId = "Please choose an affected service.";
  }

  return errors;
}

export function CreateIncidentModal() {
  const {
    isCreateIncidentModalOpen,
    closeCreateIncidentModal,
    createIncident,
    services,
  } = useAppData();
  const [form, setForm] = useState<FormState>(() => ({
    ...defaultForm,
    affectedServiceId: services[0]?.id ?? "",
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const titleRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setForm({ ...defaultForm, affectedServiceId: services[0]?.id ?? "" });
    setErrors({});
  }, [services]);

  const handleClose = useCallback(() => {
    resetForm();
    closeCreateIncidentModal();
  }, [closeCreateIncidentModal, resetForm]);

  useEffect(() => {
    if (isCreateIncidentModalOpen) {
      setTimeout(() => titleRef.current?.focus(), 0);
    }
  }, [isCreateIncidentModalOpen]);

  useEffect(() => {
    if (!isCreateIncidentModalOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isCreateIncidentModalOpen, handleClose]);

  if (!isCreateIncidentModalOpen) {
    return null;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateForm(form);
    setErrors(validation);

    if (Object.keys(validation).length > 0) {
      return;
    }

    createIncident({
      title: form.title.trim(),
      source: "manual",
      affectedServiceId: form.affectedServiceId,
      severity: form.severity,
      status: form.status,
      description: form.description.trim() || undefined,
    });

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/45 backdrop-blur-[1px]"
        onClick={handleClose}
        aria-label="Close create incident modal"
      />

      <section className="relative z-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-zinc-900">Create Incident</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Publish a new incident update and begin response tracking.
          </p>
        </div>

        {services.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
            Add at least one service before creating an incident.
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label
                htmlFor="incident-title"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                Title
              </label>
              <input
                ref={titleRef}
                id="incident-title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus:ring-2"
                placeholder="Elevated API error rates"
              />
              {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
            </div>

            <div>
              <label
                htmlFor="incident-service"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                Affected service
              </label>
              <select
                id="incident-service"
                value={form.affectedServiceId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, affectedServiceId: event.target.value }))
                }
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              >
                <option value="">Select service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              {errors.affectedServiceId && (
                <p className="mt-1 text-xs text-rose-600">{errors.affectedServiceId}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="incident-severity"
                  className="mb-1 block text-sm font-medium text-zinc-700"
                >
                  Severity
                </label>
                <select
                  id="incident-severity"
                  value={form.severity}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      severity: event.target.value as IncidentSeverity,
                    }))
                  }
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
                >
                  <option value="minor">Minor</option>
                  <option value="major">Major</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="incident-status"
                  className="mb-1 block text-sm font-medium text-zinc-700"
                >
                  Status
                </label>
                <select
                  id="incident-status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value as IncidentStatus,
                    }))
                  }
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
                >
                  <option value="investigating">Investigating</option>
                  <option value="identified">Identified</option>
                  <option value="monitoring">Monitoring</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="incident-description"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                Description <span className="text-zinc-400">(optional)</span>
              </label>
              <textarea
                id="incident-description"
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
                className="min-h-24 w-full resize-y rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus:ring-2"
                placeholder="Describe impact and current remediation efforts."
              />
            </div>

            <div className="mt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800"
              >
                Create Incident
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
