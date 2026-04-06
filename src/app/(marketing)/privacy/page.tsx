import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Statsupal",
  description: "Privacy policy for Statsupal status monitoring platform.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f8] px-5 py-10 text-zinc-900 sm:px-8">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
          Legal
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-600">
          Statsupal helps teams monitor service health and communicate incidents. This
          policy explains what information we collect and how we use it. Replace this
          content with your final legal text before public launch.
        </p>
        <div className="mt-6 space-y-5 text-sm leading-7 text-zinc-700">
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">Information we collect</h2>
            <p>
              Account details (like email), workspace settings, service configuration, and
              incident records used to operate the platform.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">How we use data</h2>
            <p>
              Data is used to provide monitoring, notifications, and status communication. We
              do not sell personal information.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">Support and requests</h2>
            <p>
              For privacy requests, contact{" "}
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
