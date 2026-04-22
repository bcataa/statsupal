"use client";

import { AppTopNav } from "@/components/layout/app-top-nav";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { useAppData } from "@/state/app-data-provider";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { dataError, isHydrated, isHydrating } = useAppData();

  return (
    <div className="app-root min-h-screen max-w-[100vw] overflow-x-hidden bg-[#05060a] text-zinc-100">
      <AppTopNav />
      <main className="min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(4.25rem+env(safe-area-inset-top,0px))] md:pb-8 md:pt-20">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-6">
          {!isHydrated || isHydrating ? (
            <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center">
              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 px-6 py-5 text-sm text-zinc-400 shadow-[0_0_40px_-12px_rgba(139,92,246,0.3)]">
                Loading your workspace data…
              </div>
            </div>
          ) : dataError ? (
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
  );
}
