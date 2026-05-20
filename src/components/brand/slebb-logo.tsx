"use client";

import Link from "next/link";

type SlebbLogoProps = {
  href?: string;
  showWordmark?: boolean;
  className?: string;
};

export function SlebbLogo({ href = "/", showWordmark = true, className = "" }: SlebbLogoProps) {
  const inner = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 shadow-[0_0_20px_-6px_rgba(99,102,241,0.8)]">
        <span className="absolute inset-0 rounded-xl border border-white/20" />
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M16 4.5h-6.7C6.8 4.5 5 6.3 5 8.7c0 2.2 1.5 3.7 4.5 4.3l2.8.6c1.9.4 2.7 1.1 2.7 2.3 0 1.4-1 2.3-3 2.3H5.8"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showWordmark ? (
        <span className="text-lg font-bold tracking-tight text-white">
          Slebb
        </span>
      ) : null}
    </span>
  );

  return href ? (
    <Link href={href} className="inline-flex items-center">
      {inner}
    </Link>
  ) : (
    inner
  );
}

