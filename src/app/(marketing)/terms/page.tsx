import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Statsupal",
  description: "Terms of Service for Statsupal status monitoring platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f8] px-5 py-10 text-zinc-900 sm:px-8">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
          Legal
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Terms of Service</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-600">
          These terms describe acceptable use of Statsupal. Review and adjust this text with
          legal counsel before broad public rollout.
        </p>
        <div className="mt-6 space-y-5 text-sm leading-7 text-zinc-700">
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">Service usage</h2>
            <p>
              You are responsible for the endpoints you monitor and the communication posted
              to your status page.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">Availability</h2>
            <p>
              Statsupal is provided as a SaaS platform and may evolve as features are
              improved. Planned maintenance can occur and will be communicated.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">Support</h2>
            <p>
              Questions about these terms can be sent to{" "}
              <a className="text-violet-700 underline underline-offset-2" href="mailto:support@statsupal.com">
                support@statsupal.com
              </a>
              .
            </p>
          </section>
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
