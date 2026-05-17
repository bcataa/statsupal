import type { Metadata } from "next";
import Link from "next/link";
import { getPublicSupportEmail, getPublicSupportMailto } from "@/lib/support/contact-info";

export const metadata: Metadata = {
  title: "Contact Support",
  description: "Contact and support options for Slebb.",
};

export default function ContactPage() {
  const supportEmail = getPublicSupportEmail();
  const supportMailto = getPublicSupportMailto();

  return (
    <main className="px-5 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="overflow-hidden rounded-3xl border border-white/8 p-8 sm:p-10" style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.12) 0%,rgba(139,92,246,0.07) 100%)" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">Contact</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Support and contact
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-300">
            We help with setup, monitoring, incidents, notifications, and account questions.
            Include your workspace or status page URL when relevant so we can respond faster.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-6">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
            <p className="text-sm font-bold text-white">Email</p>
            <a
              className="mt-2 block text-sm font-medium text-indigo-300 underline underline-offset-2 hover:text-indigo-200"
              href={supportMailto}
            >
              {supportEmail}
            </a>
            <p className="mt-2 text-xs text-zinc-500">Primary channel for product and account support.</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-6">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
            <p className="text-sm font-bold text-white">Response time</p>
            <p className="mt-2 text-sm text-zinc-300">
              We aim to reply within a few business days.
              Severe production-impacting issues are prioritized when described clearly.
            </p>
          </div>
        </div>

        <div>
          <Link href="/" className="text-sm font-medium text-zinc-400 underline-offset-4 hover:text-white hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
