"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { loggedInStatusPageHref } from "@/lib/utils/status-slug";
import { useAppData } from "@/state/app-data-provider";

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

export function MobileTabBar() {
  const pathname = usePathname() ?? "";
  const { workspace, currentProject } = useAppData();
  const pageHref = loggedInStatusPageHref(workspace, currentProject);

  const tabs = [
    {
      label: "Monitors",
      href: "/services",
      active: isMonitorsActive(pathname),
      icon: IconMonitors,
    },
    {
      label: "Issues",
      href: "/incidents",
      active: isIssuesActive(pathname),
      icon: IconIssues,
    },
    {
      label: "Page",
      href: pageHref,
      active: isPageActive(pathname),
      icon: IconPage,
    },
    {
      label: "Apps",
      href: "/apps",
      active: isAppsActive(pathname),
      icon: IconApps,
    },
  ] as const;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#06070a]/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.6)] backdrop-blur-xl md:hidden"
      aria-label="Primary navigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around gap-0 px-1">
        {tabs.map(({ label, href, active, icon: Icon }) => (
          <li key={label} className="min-w-0 flex-1">
            <Link
              href={href}
              className={[
                "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-medium tracking-wide transition-colors active:opacity-90",
                active ? "text-cyan-200" : "text-zinc-500",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  active
                    ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/40"
                    : "bg-white/[0.04] text-zinc-500",
                ].join(" ")}
                aria-hidden
              >
                <Icon />
              </span>
              <span className="max-w-full truncate">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function IconMonitors() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function IconIssues() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 8v5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
      <path
        d="M12 3 3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPage() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 8h8M8 12h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconApps() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}
