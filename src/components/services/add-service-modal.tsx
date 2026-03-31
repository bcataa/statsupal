"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useAppData } from "@/state/app-data-provider";
import type { CheckType } from "@/lib/models/monitoring";
import { getSupabaseErrorDetails } from "@/lib/supabase/app-data";

type FormState = {
  name: string;
  url: string;
  checkType: CheckType;
  checkInterval: string;
  description: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const defaultState: FormState = {
  name: "",
  url: "",
  checkType: "http",
  checkInterval: "1 min",
  description: "",
};

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Service name is required.";
  }

  if (!form.url.trim()) {
    errors.url = "URL is required.";
  } else {
    try {
      new URL(form.url);
    } catch {
      errors.url = "Enter a valid URL including https://.";
    }
  }

  if (!form.checkInterval.trim()) {
    errors.checkInterval = "Check interval is required.";
  }

  return errors;
}

export function AddServiceModal() {
  const {
    isAddServiceModalOpen,
    closeAddServiceModal,
    addService,
  } = useAppData();
  const [form, setForm] = useState<FormState>(defaultState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setForm(defaultState);
    setErrors({});
    setSubmitError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    closeAddServiceModal();
  }, [closeAddServiceModal, resetForm]);

  useEffect(() => {
    if (isAddServiceModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isAddServiceModalOpen]);

  useEffect(() => {
    if (!isAddServiceModalOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isAddServiceModalOpen, handleClose]);

  if (!isAddServiceModalOpen) {
    return null;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateForm(form);
    setErrors(validation);

    if (Object.keys(validation).length > 0) {
      return;
    }

    try {
      setIsSaving(true);
      setSubmitError(null);
      await addService({
        name: form.name.trim(),
        url: form.url.trim(),
        checkType: form.checkType,
        checkInterval: form.checkInterval.trim(),
        description: form.description.trim() || undefined,
      });

      handleClose();
    } catch (error) {
      const details = getSupabaseErrorDetails(error);
      console.error("[AddServiceModal] create failed", {
        message: details.message,
        code: details.code,
        details: details.details,
        hint: details.hint,
        stack: details.stack,
      });
      setSubmitError(
        [
          details.message || "Could not create service.",
          details.code ? `(code: ${details.code})` : "",
          details.hint ? `Hint: ${details.hint}` : "",
        ]
          .filter(Boolean)
          .join(" "),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/45 backdrop-blur-[1px]"
        onClick={handleClose}
        aria-label="Close add service modal"
      />

      <section className="relative z-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-zinc-900">Add Service</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Register a new monitor and start collecting health checks.
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="service-name" className="mb-1 block text-sm font-medium text-zinc-700">
              Service name
            </label>
            <input
              ref={inputRef}
              id="service-name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus:ring-2"
              placeholder="Authentication API"
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="service-url" className="mb-1 block text-sm font-medium text-zinc-700">
              URL
            </label>
            <input
              id="service-url"
              value={form.url}
              onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus:ring-2"
              placeholder="https://api.your-service.com"
            />
            {errors.url && <p className="mt-1 text-xs text-rose-600">{errors.url}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="service-check-type"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                Check type
              </label>
              <select
                id="service-check-type"
                value={form.checkType}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    checkType: event.target.value as CheckType,
                  }))
                }
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              >
                <option value="http">HTTP</option>
                <option value="ping">Ping</option>
                <option value="api">API</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="service-check-interval"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                Check interval
              </label>
              <input
                id="service-check-interval"
                value={form.checkInterval}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, checkInterval: event.target.value }))
                }
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus:ring-2"
                placeholder="1 min"
              />
              {errors.checkInterval && (
                <p className="mt-1 text-xs text-rose-600">{errors.checkInterval}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="service-description"
              className="mb-1 block text-sm font-medium text-zinc-700"
            >
              Description <span className="text-zinc-400">(optional)</span>
            </label>
            <textarea
              id="service-description"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              className="min-h-24 w-full resize-y rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus:ring-2"
              placeholder="Briefly describe what this service is responsible for."
            />
          </div>

          {submitError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {submitError}
            </p>
          ) : null}

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
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Creating..." : "Create Service"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
