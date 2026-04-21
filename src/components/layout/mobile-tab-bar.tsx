"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Home", href: "/dashboard" },
  { label: "Monitors", href: "/services" },
  { label: "Issues", href: "/incidents" },
  { label: "Settings", href: "/settings" },
] as const;

function isOverviewActive(pathname: string): boolean {
  if (pathname.startsWith("/dashboard/status")) {
    return false;
  }
  return pathname === "/dashboard" || pathname === "/";
}

function isTabActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return isOverviewActive(pathname);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileTabBar() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200/90 bg-white/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden"
      aria-label="Primary navigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around gap-0 px-1">
        {tabs.map(({ label, href }) => {
          const active = isTabActive(pathname, href);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                className={[
                  "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-medium tracking-wide transition-colors active:opacity-80",
                  active ? "text-zinc-900" : "text-zinc-400",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                    active ? "bg-zinc-900 text-white" : "bg-zinc-100/80 text-zinc-500",
                  ].join(" ")}
                  aria-hidden
                >
                  {href === "/dashboard" ? (
                    <IconOverview />
                  ) : href === "/services" ? (
                    <IconMonitors />
                  ) : href === "/incidents" ? (
                    <IconIssues />
                  ) : (
                    <IconSettings />
                  )}
                </span>
                <span className="max-w-full truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function IconOverview() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
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

function IconSettings() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
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
