import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Showcase | Statsupal",
  description: "See a sample public status page built with Statsupal.",
};

export default function ShowcasePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
          Showcase
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          See a public status page
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600">
          This opens the same visitor-facing experience your customers get: live service health,
          uptime context, and a clean layout—no dashboard or login required.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/status/main-status-page"
            className="inline-flex h-11 items-center rounded-full bg-[#5f58f7] px-6 text-sm font-medium text-white hover:bg-[#544df1]"
          >
            Open sample status page
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center rounded-full border border-zinc-300 bg-white px-6 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Create your own
          </Link>
        </div>
      </div>
    </main>
  );
}
