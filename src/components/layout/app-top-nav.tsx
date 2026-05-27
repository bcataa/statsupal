"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { UserMenu } from "@/components/auth/user-menu";
import { SlebbLogo } from "@/components/brand/slebb-logo";
import { loggedInStatusPageHref } from "@/lib/utils/status-slug";
import { useAppData } from "@/state/app-data-provider";

// Settings & Team accessible via account dropdown, not main nav
const NAV = [
  { label: "Overview",      href: "/overview" },
  { label: "Monitors",      href: "/services" },
  { label: "Incidents",     href: "/incidents" },
  { label: "Status Pages",  key: "page" as const },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/overview")  return pathname === "/overview";
  if (href === "/services")  return pathname === "/services" || /^\/services\//.test(pathname);
  if (href === "/incidents") return pathname === "/incidents" || pathname.startsWith("/incidents/");
  return false;
}

function isPageActive(pathname: string) {
  return pathname.startsWith("/dashboard/status");
}

export function AppTopNav() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { workspace, currentProject } = useAppData();
  const pageHref = loggedInStatusPageHref(workspace, currentProject);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    router.push(q ? `/services?q=${encodeURIComponent(q)}` : "/services");
    setSearchOpen(false);
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-40 border-b border-white/[0.06] bg-[#02020a]/80 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">

        {/* Logo */}
        <SlebbLogo href="/overview" />

        {/* Center nav */}
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
          {NAV.map((item) => {
            if ("key" in item && item.key === "page") {
              const active = isPageActive(pathname);
              return (
                <Link key="page" href={pageHref}
                  className={[
                    "relative px-4 py-2 text-sm font-medium transition-colors",
                    active ? "text-white" : "text-zinc-400 hover:text-zinc-100",
                  ].join(" ")}>
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-white" />
                  )}
                </Link>
              );
            }
            if (!("href" in item)) return null;
            const active = isActive(pathname, item.href);
            return (
              <Link key={item.label} href={item.href}
                className={[
                  "relative px-4 py-2 text-sm font-medium transition-colors",
                  active ? "text-white" : "text-zinc-400 hover:text-zinc-100",
                ].join(" ")}>
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSearchOpen((o) => !o)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:text-zinc-100"
              aria-label="Search monitors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="10.5" cy="10.5" r="6.5" /><path d="M16 16l5 5" />
              </svg>
            </button>
            {searchOpen && (
              <form onSubmit={submitSearch} className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-white/10 bg-[#0d0f14] p-2 shadow-2xl sm:w-64">
                <input
                  autoFocus
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Filter monitors…"
                  className="w-full rounded-lg border border-white/10 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:ring-1 focus:ring-white/30"
                />
              </form>
            )}
          </div>
          <UserMenu variant="app" />
        </div>
      </div>
    </header>
  );
}
