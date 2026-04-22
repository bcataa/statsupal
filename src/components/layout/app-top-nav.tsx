"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { UserMenu } from "@/components/auth/user-menu";
import { loggedInStatusPageHref } from "@/lib/utils/status-slug";
import { useAppData } from "@/state/app-data-provider";

const centerNav = [
  { label: "Monitors", href: "/services" },
  { label: "Issues", href: "/incidents" },
  { label: "Page", key: "page" as const },
  { label: "Apps", href: "/apps" },
] as const;

function isMonitorsActive(pathname: string): boolean {
  return pathname === "/services" || /^\/services\/[^/]+$/.test(pathname);
}

function isIssuesActive(pathname: string): boolean {
  return pathname === "/incidents" || pathname.startsWith("/incidents/");
}

function isAppsActive(pathname: string): boolean {
  return pathname === "/apps" || pathname.startsWith("/apps/");
}

function isPageActive(pathname: string): boolean {
  return pathname.startsWith("/dashboard/status");
}

export function AppTopNav() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { workspace, currentProject } = useAppData();
  const pageHref = loggedInStatusPageHref(workspace, currentProject);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/services");
    }
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const q = searchValue.trim();
    router.push(q ? `/services?q=${encodeURIComponent(q)}` : "/services");
    setSearchOpen(false);
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-40 border-b border-white/5 bg-[#06070a]/90 pt-[env(safe-area-inset-top,0px)] shadow-[0_1px_0_0_rgba(255,255,255,0.03)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 max-w-[1600px] min-w-0 items-center justify-between gap-2 px-3 sm:h-16 sm:px-4">
        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-300 transition hover:border-cyan-500/30 hover:text-white"
            aria-label="Go back"
          >
            <IconBack />
          </button>
          <Link
            href="/settings"
            className="hidden max-w-[8rem] truncate rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-zinc-200 sm:inline sm:max-w-[11rem]"
            title={workspace.name}
          >
            {workspace.name}
          </Link>
          <Link
            href="/settings"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:text-zinc-100"
            aria-label="Settings"
          >
            <IconSettings />
          </Link>
        </div>

        <nav
          className="absolute left-1/2 z-10 hidden -translate-x-1/2 md:flex"
          aria-label="Primary"
        >
          <div className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-zinc-900/50 p-1">
            {centerNav.map((item) => {
              if ("key" in item && item.key === "page") {
                const active = isPageActive(pathname);
                return (
                  <Link
                    key="page"
                    href={pageHref}
                    className={[
                      "rounded-full px-4 py-1.5 text-sm font-medium transition",
                      active
                        ? "bg-cyan-500/15 text-cyan-100 shadow-[0_0_20px_-6px_rgba(34,211,238,0.45)]"
                        : "text-zinc-500 hover:text-zinc-200",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-1.5">
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                      )}
                      Page
                    </span>
                  </Link>
                );
              }
              if (!("href" in item)) {
                return null;
              }
              const href = item.href;
              const active =
                (href === "/services" && isMonitorsActive(pathname)) ||
                (href === "/incidents" && isIssuesActive(pathname)) ||
                (href === "/apps" && isAppsActive(pathname));
              return (
                <Link
                  key={item.label}
                  href={href}
                  className={[
                    "rounded-full px-4 py-1.5 text-sm font-medium transition",
                    active
                      ? "bg-violet-500/20 text-violet-100 ring-1 ring-violet-500/40"
                      : "text-zinc-500 hover:text-zinc-200",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-1.5">
                    {active && item.label === "Monitors" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                    )}
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSearchOpen((o) => !o)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:text-zinc-100"
              aria-label="Search monitors"
            >
              <IconSearch />
            </button>
            {searchOpen ? (
              <form
                onSubmit={submitSearch}
                className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-white/10 bg-[#0d0f14] p-2 shadow-2xl sm:w-64"
              >
                <input
                  autoFocus
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Filter monitors…"
                  className="w-full rounded-lg border border-white/10 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:ring-1 focus:ring-cyan-500/50"
                />
                <p className="mt-1 text-[10px] text-zinc-500">Filters the monitors list</p>
              </form>
            ) : null}
          </div>
          <div className="border-l border-white/10 pl-1 sm:pl-2">
            <UserMenu variant="app" />
          </div>
        </div>
      </div>
    </header>
  );
}

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 5 8 12l7 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16 16 21 21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
