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
    <header className="fixed top-0 right-0 left-0 z-30 border-b border-zinc-200/80 bg-white/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur md:left-64">
      <div className="flex min-h-14 min-w-0 items-center justify-between gap-2 px-4 py-2 sm:h-16 sm:px-6 sm:py-0">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50/80 text-zinc-800 active:bg-zinc-100 md:hidden"
            aria-label="Open navigation menu"
          >
            <span className="flex flex-col gap-1">
              <span className="block h-0.5 w-[18px] rounded bg-zinc-700" />
              <span className="block h-0.5 w-[18px] rounded bg-zinc-700" />
              <span className="block h-0.5 w-[18px] rounded bg-zinc-700" />
            </span>
          </button>
          <span className="hidden rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-violet-700 md:inline">
            STATSUPAL
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-900 md:text-lg">
              {title}
            </h1>
            <p className="mt-0.5 truncate text-[11px] leading-tight text-zinc-500 md:hidden">
              {workspace.name} · {currentProject?.name ?? "Project"}
            </p>
          </div>
          <span className="hidden shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600 md:inline">
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
