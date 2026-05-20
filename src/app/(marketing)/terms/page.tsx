import type { Metadata } from "next";
import Link from "next/link";
import { getPublicSupportEmail, getPublicSupportMailto } from "@/lib/support/contact-info";

export const metadata: Metadata = {
  title: "Terms of Service | Slebb",
  description: "Terms of Service for Slebb status monitoring platform.",
};

export default function TermsPage() {
  const supportEmail = getPublicSupportEmail();
  const supportMailto = getPublicSupportMailto();

  return (
    <main className="px-5 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/8 bg-white/4 p-8 shadow-[0_0_60px_-20px_rgba(99,102,241,0.3)] backdrop-blur-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
          Legal
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Terms of Service</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-300">
          By using Slebb you agree to these terms. If you are using the product on behalf of an
          organization, you confirm you have authority to bind that organization.
        </p>
        <div className="mt-6 space-y-5 text-sm leading-7 text-zinc-300">
          <section>
            <h2 className="text-lg font-semibold text-white">The service</h2>
            <p>
              Slebb provides monitoring, incident tracking, notifications, and public status pages. We
              may change or discontinue features with reasonable notice where practicable.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Your responsibilities</h2>
            <p>
              You are responsible for URLs and systems you monitor, content on your status page, compliance
              with laws applicable to you, and obtaining consent from subscribers you email. You must not use
              the service to attack, scan without authorization, or violate others&apos; rights.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Acceptable use</h2>
            <p>
              Do not misuse APIs, attempt to bypass security, overload infrastructure, or access data that is
              not yours. We may suspend accounts that risk the platform or other customers.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Availability</h2>
            <p>
              We strive for reliability but do not guarantee uninterrupted operation. Planned maintenance,
              third-party outages (including Supabase, hosting, Discord, or email providers), and emergency
              changes may affect availability.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Disclaimer</h2>
            <p>
              The service is provided &quot;as is&quot; to the extent permitted by law. Monitoring and
              notifications are aids only; you remain responsible for your own operations and customer
              communication.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, Slebb and its suppliers are not liable for
              indirect, incidental, or consequential damages, or loss of profits or data, arising from use
              of the service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p>
              Questions about these terms:{" "}
              <a className="text-indigo-300 underline underline-offset-2" href={supportMailto}>
                {supportEmail}
              </a>
              .
            </p>
          </section>
        </div>
        <div className="mt-8">
          <Link href="/" className="text-sm font-medium text-zinc-400 underline-offset-4 hover:text-white hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
