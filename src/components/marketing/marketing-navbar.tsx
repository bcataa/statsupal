"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
    "block rounded-lg px-3 py-2.5 text-sm transition-colors",
    active ? "bg-zinc-900 font-medium text-white" : "text-zinc-700 hover:bg-zinc-100",
  ].join(" ");
}

function navLinkClassDesktop(pathname: string, href: string): string {
  const active =
    pathname === href || (href.length > 1 && pathname.startsWith(`${href}/`));
  return [
    "transition-colors",
    active ? "font-medium text-zinc-900" : "text-zinc-700 hover:text-zinc-900",
  ].join(" ");
}

export function MarketingNavbar() {
  const pathname = usePathname() ?? "";
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-[#f5f5f8]/90 shadow-sm backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-8 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-8">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-lg font-semibold text-zinc-900 sm:text-[22px]"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-indigo-300 text-[10px] text-indigo-600">
              S
            </span>
            <span className="truncate text-base font-semibold sm:text-base">Statsupal</span>
          </Link>
          <nav
            className="hidden min-w-0 items-center gap-5 text-sm lg:flex xl:gap-6"
            aria-label="Marketing"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={navLinkClassDesktop(pathname, item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 md:inline-flex"
            prefetch
          >
            Log in
          </Link>
          <Link
            href="/register"
            prefetch
            className="inline-flex h-9 items-center rounded-full bg-[#5f58f7] px-3 text-sm font-medium text-white shadow-sm shadow-indigo-500/40 transition hover:bg-[#544df1] sm:px-4"
          >
            Get started
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-800 shadow-sm lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="marketing-mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="marketing-mobile-nav"
          className="border-t border-zinc-200 bg-[#f5f5f8]/95 px-4 py-3 shadow-inner lg:hidden"
        >
          <nav className="flex max-h-[min(70vh,28rem)] flex-col gap-0.5 overflow-y-auto" aria-label="Marketing mobile">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} prefetch className={navLinkClass(pathname, item.href)}>
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              prefetch
              className="mt-2 block rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-center text-sm font-medium text-zinc-800"
            >
              Log in
            </Link>
            <Link
              href="/contact"
              prefetch
              className="block rounded-lg px-3 py-2 text-center text-sm text-zinc-600 hover:bg-zinc-100"
            >
              Contact
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
