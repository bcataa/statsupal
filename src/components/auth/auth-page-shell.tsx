"use client";

import Link from "next/link";
import { HeroCanvasBackground } from "@/components/marketing/hero-canvas-background";
import { useEffect, useState } from "react";

type AuthPageShellProps = {
  children: React.ReactNode;
};

export function AuthPageShell({ children }: AuthPageShellProps) {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#080c1e] text-zinc-100">
      <HeroCanvasBackground scrollY={scrollY} />

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%),radial-gradient(ellipse 50% 40% at 10% 60%, rgba(34,211,238,0.07) 0%, transparent 60%)",
        }}
      />

      <main className="relative z-10 flex min-h-screen flex-col px-4 py-10 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-8 flex items-center justify-center">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-base font-bold text-white transition hover:opacity-80"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white shadow-lg shadow-indigo-500/40">
                S
              </span>
              <span className="text-lg font-bold tracking-tight">Slebb</span>
            </Link>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
