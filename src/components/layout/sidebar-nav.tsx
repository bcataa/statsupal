"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/lib/navigation";
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
          const statusSlug =
            currentProject?.slug ||
            workspace.projects[0]?.slug ||
            workspace.domainSettings.statusPageSlug;
          const href =
            item.label === "Status Page"
              ? `/status/${encodeURIComponent(statusSlug)}`
              : item.href;
          const active = isActive(pathname, href);

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
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-medium text-zinc-500">Current plan</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">Free</p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Full monitoring and public status page. Visit the marketing site for plan updates.
          </p>
        </div>
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
