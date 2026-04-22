"use client";

import { useAppData } from "@/state/app-data-provider";

type CreateIncidentButtonProps = {
  className?: string;
};

export function CreateIncidentButton({ className }: CreateIncidentButtonProps) {
  const { openCreateIncidentModal } = useAppData();

  return (
    <button
      type="button"
      onClick={openCreateIncidentModal}
      className={
        className ??
        "inline-flex h-10 items-center justify-center rounded-xl border border-violet-500/40 bg-violet-600 px-4 text-sm font-medium text-white shadow-lg shadow-violet-900/25 transition-colors hover:bg-violet-500"
      }
    >
      Create Incident
    </button>
  );
}
