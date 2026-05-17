import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Showcase",
  description: "See a sample public status page built with Slebb.",
};

export default function ShowcasePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <div className="overflow-hidden rounded-3xl border border-white/8 p-8 sm:p-10" style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.12) 0%,rgba(139,92,246,0.07) 100%)" }}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">Showcase</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          See a public status page live
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
          This opens the same visitor-facing experience your customers get: live service health,
          uptime context, and a clean animated layout — no dashboard or login required.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/status/main-status-page"
            className="inline-flex h-11 items-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-violet-500"
          >
            Open sample status page
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center rounded-full border border-white/15 px-6 text-sm font-medium text-zinc-300 transition hover:border-white/30 hover:text-white"
          >
            Create your own
          </Link>
        </div>
      </div>
    </main>
  );
}
