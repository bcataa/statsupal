"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/product", label: "Product" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/showcase", label: "Showcase" },
  { href: "/integrations", label: "Integrations" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

function navLinkClass(pathname: string, href: string): string {
  const active =
    pathname === href || (href.length > 1 && pathname.startsWith(`${href}/`));
  return [
    "transition-colors",
    active ? "font-medium text-zinc-900" : "text-zinc-700 hover:text-zinc-900",
  ].join(" ");
}

export function MarketingNavbar() {
  const pathname = usePathname() ?? "";

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-[#f5f5f8]/85 shadow-sm backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-6 lg:gap-8">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-[22px] font-semibold text-zinc-900"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-indigo-300 text-[10px] text-indigo-600">
              S
            </span>
            <span className="text-base font-semibold">Statsupal</span>
          </Link>
          <nav
            className="hidden min-w-0 items-center gap-6 text-sm lg:flex"
            aria-label="Marketing"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={navLinkClass(pathname, item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 sm:inline-flex"
            prefetch
          >
            Log in
          </Link>
          <Link
            href="/register"
            prefetch
            className="inline-flex h-9 items-center rounded-full bg-[#5f58f7] px-4 text-sm font-medium text-white shadow-sm shadow-indigo-500/40 transition hover:bg-[#544df1]"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
