import type { Metadata } from "next";
import Link from "next/link";
import { getPublicSupportEmail, getPublicSupportMailto } from "@/lib/support/contact-info";

export const metadata: Metadata = {
  title: "Privacy Policy | Statsupal",
  description: "Privacy policy for Statsupal status monitoring platform.",
};

export default function PrivacyPage() {
  const supportEmail = getPublicSupportEmail();
  const supportMailto = getPublicSupportMailto();

  return (
    <main className="px-5 py-10 text-zinc-900 sm:px-8">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
          Legal
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-600">
          This policy describes how Statsupal (&quot;we&quot;, &quot;us&quot;) handles information when you use our
          website and service. If anything here conflicts with a signed agreement you have with us, the
          agreement takes precedence.
        </p>
        <div className="mt-6 space-y-5 text-sm leading-7 text-zinc-700">
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">What we collect</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Account data:</strong> email address and profile details you provide when you
                register or update your account (stored in Supabase Auth).
              </li>
              <li>
                <strong>Workspace and monitoring data:</strong> names and URLs of services you choose to
                monitor, check settings, incident and maintenance records, and content you publish on your
                status page.
              </li>
              <li>
                <strong>Notification settings:</strong> preferences for Discord, webhooks, and email
                alerts; subscriber email addresses you collect for status updates; optional support or alert
                email addresses you enter in workspace settings.
              </li>
              <li>
                <strong>Technical logs:</strong> our servers and hosting providers may process IP addresses,
                request metadata, and diagnostic logs for security, reliability, and abuse prevention. We do
                not use this for third-party advertising.
              </li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">How we use information</h2>
            <p>
              We use the data above to run monitoring checks, deliver notifications you configure, display
              your public status page, improve reliability, and respond to support requests. Processing is
              based on performing our contract with you and our legitimate interests in operating a secure
              service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">Where data is stored</h2>
            <p>
              Data is stored in your Supabase project and processed on infrastructure you configure (for
              example Railway). You are responsible for the region and retention settings of those providers.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">Sharing</h2>
            <p>
              We do not sell personal information. We use subprocessors you enable by configuration (for
              example email delivery via Resend, or Discord when you connect a bot or webhook). Those
              providers process data only as needed to perform the features you turn on.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">Retention</h2>
            <p>
              We retain information for as long as your account is active and as needed to provide the
              service. You may request deletion of your account data by contacting us (see below).
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">Your choices</h2>
            <p>
              You can update many settings in the product. For access, export, correction, or deletion
              requests, contact us at{" "}
              <a className="text-violet-700 underline underline-offset-2" href={supportMailto}>
                {supportEmail}
              </a>
              .
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">Contact</h2>
            <p>
              Questions about this policy:{" "}
              <a className="text-violet-700 underline underline-offset-2" href={supportMailto}>
                {supportEmail}
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
