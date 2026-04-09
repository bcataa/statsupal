"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/lib/navigation";
import { loggedInStatusPageHref } from "@/lib/utils/status-slug";
import { useAppData } from "@/state/app-data-provider";

type SidebarNavProps = {
  onNavigate?: () => void;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { workspace, currentProject } = useAppData();

  return (
    <div className="flex h-full flex-col bg-white px-4 py-6">
      <div className="mb-8 px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {workspace.name}
        </p>
        <p className="mt-1 text-lg font-semibold text-zinc-900">
          {currentProject?.name ?? "Monitoring"}
        </p>
      </div>

      <nav className="space-y-1.5">
        {navigationItems.map((item) => {
          const href =
            item.label === "Status Page"
              ? loggedInStatusPageHref(workspace, currentProject)
              : item.href;
          const active =
            item.label === "Status Page"
              ? pathname.startsWith("/dashboard/status")
              : isActive(pathname, href);

          return (
            <Link
              key={item.label}
              href={href}
              onClick={onNavigate}
              className={[
                "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
              ].join(" ")}
            >
              <span>{item.label}</span>
              {active && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1 px-2 text-xs text-zinc-500">
          <Link href="/privacy" className="hover:text-zinc-800">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-zinc-800">
            Terms
          </Link>
          <Link href="/contact" className="hover:text-zinc-800">
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}
