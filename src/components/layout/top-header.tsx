"use client";

import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/auth/user-menu";
import { getPageTitle } from "@/lib/navigation";
import { useAppData } from "@/state/app-data-provider";

type TopHeaderProps = {
  onOpenSidebar: () => void;
};

export function TopHeader({ onOpenSidebar }: TopHeaderProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const { workspace, currentProject } = useAppData();

  return (
    <header className="fixed top-0 right-0 left-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur md:left-64">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 md:hidden"
            aria-label="Open navigation menu"
          >
            <span className="flex flex-col gap-1">
              <span className="block h-0.5 w-4 rounded bg-zinc-700" />
              <span className="block h-0.5 w-4 rounded bg-zinc-700" />
              <span className="block h-0.5 w-4 rounded bg-zinc-700" />
            </span>
          </button>
          <span className="hidden rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-violet-700 md:inline">
            STATSUPAL
          </span>
          <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
          <span className="hidden rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600 md:inline">
            {workspace.name} / {currentProject?.name ?? "Project"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
