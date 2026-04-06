import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Support | Statsupal",
  description: "Contact and support options for Statsupal.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f8] px-5 py-10 text-zinc-900 sm:px-8">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
          Contact
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Support and Contact
        </h1>
        <p className="mt-4 text-sm leading-7 text-zinc-600">
          Need help with setup, incidents, notifications, or billing? Reach out and we will
          get back to you as soon as possible.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-sm font-semibold text-zinc-900">Email support</p>
            <a
              className="mt-1 block text-sm text-violet-700 underline underline-offset-2"
              href="mailto:support@statsupal.com"
            >
              support@statsupal.com
            </a>
            <p className="mt-2 text-xs text-zinc-500">Best for account and product questions.</p>
          </article>
          <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-sm font-semibold text-zinc-900">Response expectations</p>
            <p className="mt-1 text-sm text-zinc-700">Business day replies for launch plan users.</p>
            <p className="mt-2 text-xs text-zinc-500">Critical production issues are prioritized.</p>
          </article>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
