"use client";

import { useEffect, useState, type ReactNode } from "react";

type ResolvedIncidentsArchiveProps = {
  count: number;
  children: ReactNode;
};

export function ResolvedIncidentsArchive({ count, children }: ResolvedIncidentsArchiveProps) {
  const [open, setOpen] = useState(count <= 3);

  useEffect(() => {
    setOpen(count <= 3);
  }, [count]);

  if (count === 0) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/50 to-zinc-950/90 shadow-lg ring-1 ring-white/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-white/5 sm:px-5 sm:py-4"
        aria-expanded={open}
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-400 shadow-sm"
          aria-hidden
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
            />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-zinc-100">Resolved archive</h3>
          <p className="mt-0.5 text-sm text-zinc-500">
            {count} resolved incident{count === 1 ? "" : "s"} · tap to {open ? "collapse" : "expand"}
          </p>
        </div>
        <span
          className={[
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/80 text-zinc-400 transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>
      {open ? (
        <div
          className={[
            "border-t border-white/10 bg-zinc-950/40 px-3 pb-4 pt-2 sm:px-4",
            count > 8
              ? "max-h-[min(70vh,36rem)] overflow-y-auto overflow-x-hidden overscroll-y-contain"
              : "",
          ].join(" ")}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
