"use client";

import Link from "next/link";

type SlebbLogoProps = {
  href?: string;
  showWordmark?: boolean;
  size?: "sm" | "md";
  className?: string;
};

/** Matches the shared reference: rounded square with gradient S + bold wordmark */
export function SlebbLogo({ href = "/", showWordmark = true, size = "md", className = "" }: SlebbLogoProps) {
  const iconSize = size === "sm" ? "h-7 w-7 rounded-lg" : "h-9 w-9 rounded-xl";
  const svgSize = size === "sm" ? 14 : 18;
  const textClass = size === "sm" ? "text-sm font-bold" : "text-base font-bold";

  const icon = (
    <span className={`relative inline-flex shrink-0 items-center justify-center ${iconSize}`}
      style={{
        background: "linear-gradient(145deg, #5865f2 0%, #8b5cf6 45%, #c026d3 100%)",
        boxShadow: "0 0 22px -4px rgba(139,92,246,0.85), inset 0 1px 0 rgba(255,255,255,0.15)",
      }}>
      {/* Inner border */}
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/20" />
      {/* S letterform — italic bold, matching reference */}
      <svg width={svgSize} height={svgSize} viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M14.5 5.2C13.6 4.4 12.4 4 11 4c-2.8 0-4.8 1.6-4.8 3.8 0 1.8 1.1 2.9 3.4 3.4l1.4.3c1.3.3 1.8.8 1.8 1.6 0 1-.8 1.7-2.2 1.7H5.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.8 15H9.8"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );

  const wordmark = showWordmark ? (
    <span className={`tracking-tight text-white ${textClass}`}>Slebb</span>
  ) : null;

  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {icon}
      {wordmark}
    </span>
  );

  return href ? (
    <Link href={href} className="inline-flex items-center">
      {inner}
    </Link>
  ) : inner;
}
