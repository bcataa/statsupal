"use client";

import { AppTopNav } from "@/components/layout/app-top-nav";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SpaceBackground } from "@/components/layout/space-background";
import { useAppData } from "@/state/app-data-provider";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { dataError, isHydrated, isHydrating } = useAppData();
  const busy = !isHydrated || isHydrating;

  return (
    <div className="app-root relative min-h-screen max-w-[100vw] overflow-x-hidden bg-[#02020a] text-zinc-100">
      <SpaceBackground />
      <div className="relative z-10">
      <AppTopNav />
      <main
        className="min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(4.25rem+env(safe-area-inset-top,0px))] md:pb-8 md:pt-20"
        aria-busy={busy}
      >
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6">
          {dataError ? (
            <div className="mx-auto w-full max-w-3xl">
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100 shadow-lg">
                <h2 className="text-base font-semibold">We could not load your data</h2>
                <p className="mt-2 text-sm text-rose-200/90">{dataError}</p>
                <p className="mt-3 text-xs text-rose-300/80">
                  Please verify Supabase tables and RLS, then refresh the page.
                </p>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
      <MobileTabBar />
      </div>
    </div>
  );
}
