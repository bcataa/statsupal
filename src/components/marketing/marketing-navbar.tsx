"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SlebbLogo } from "@/components/brand/slebb-logo";

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
    active ? "bg-white/10 font-semibold text-white" : "text-zinc-300 hover:bg-white/5 hover:text-white",
  ].join(" ");
}

function navLinkClassDesktop(pathname: string, href: string): string {
  const active =
    pathname === href || (href.length > 1 && pathname.startsWith(`${href}/`));
  return [
    "transition-colors text-sm",
    active ? "font-semibold text-white" : "text-zinc-400 hover:text-zinc-100",
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
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0a0c1e]/85 shadow-lg shadow-black/30 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-8 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-8">
          <SlebbLogo href="/" />
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
            className="hidden text-sm font-medium text-zinc-400 transition-colors hover:text-white md:inline-flex"
            prefetch
          >
            Log in
          </Link>
          <Link
            href="/register"
            prefetch
            className="inline-flex h-9 items-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-3 text-sm font-semibold text-white shadow-sm shadow-indigo-500/40 transition hover:from-indigo-400 hover:to-violet-500 sm:px-4"
          >
            Get started
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 shadow-sm lg:hidden"
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
          className="border-t border-white/8 bg-[#0a0c1e]/95 px-4 py-3 lg:hidden"
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
              className="mt-2 block rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-center text-sm font-medium text-zinc-200"
            >
              Log in
            </Link>
            <Link
              href="/contact"
              prefetch
              className="block rounded-lg px-3 py-2 text-center text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              Contact
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
