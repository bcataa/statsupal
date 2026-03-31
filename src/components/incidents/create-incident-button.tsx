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
        "inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800"
      }
    >
      Create Incident
    </button>
  );
}
