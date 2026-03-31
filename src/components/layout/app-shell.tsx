"use client";

import { useState } from "react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopHeader } from "@/components/layout/top-header";
import { useAppData } from "@/state/app-data-provider";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { dataError, isHydrated, isHydrating } = useAppData();

  return (
    <div className="min-h-screen bg-zinc-100">
      <aside className="fixed top-0 left-0 z-30 hidden h-screen w-64 border-r border-zinc-200 bg-white md:block">
        <SidebarNav />
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-900/25"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation menu"
          />
          <aside className="relative h-full w-64 border-r border-zinc-200 bg-white shadow-xl">
            <SidebarNav onNavigate={() => setIsSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <div className="md:pl-64">
        <TopHeader onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="px-4 pt-24 pb-8 sm:px-6">
          {!isHydrated || isHydrating ? (
            <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center">
              <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 text-sm text-zinc-600 shadow-sm">
                Loading your workspace data...
              </div>
            </div>
          ) : dataError ? (
            <div className="mx-auto w-full max-w-3xl">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                <h2 className="text-base font-semibold text-red-800">
                  We could not load your data
                </h2>
                <p className="mt-2 text-sm text-red-700">{dataError}</p>
                <p className="mt-3 text-xs text-red-600">
                  Please verify Supabase tables/RLS settings, then refresh the page.
                </p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
