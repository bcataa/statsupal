"use client";

import { useAppData } from "@/state/app-data-provider";

type AddServiceButtonProps = {
  className?: string;
  children?: React.ReactNode;
};

export function AddServiceButton({ className, children = "Add monitor" }: AddServiceButtonProps) {
  const { openAddServiceModal } = useAppData();

  return (
    <button
      type="button"
      onClick={openAddServiceModal}
      className={
        className ??
        "inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800"
      }
    >
      {children}
    </button>
  );
}
