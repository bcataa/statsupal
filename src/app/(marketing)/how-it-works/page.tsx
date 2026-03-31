import Link from "next/link";
import { RevealSection } from "@/components/marketing/reveal-section";

const steps = [
  {
    title: "1. Connect your services",
    description:
      "Add your APIs, websites, and internal endpoints with check intervals and monitoring types.",
  },
  {
    title: "2. Monitor in real time",
    description:
      "Automatic HTTP checks run continuously and update operational, degraded, or down states.",
  },
  {
    title: "3. Auto-detect incidents",
    description:
      "When checks fail, incidents are created automatically and linked to affected services.",
  },
  {
    title: "4. Communicate clearly",
    description:
      "Share updates on your public status page with active and resolved incidents in a trustworthy format.",
  },
  {
    title: "5. Resolve and recover",
    description:
      "Mark incidents through investigating, identified, monitoring, and resolved with clear history.",
  },
];

const highlights = [
  "Live status updates without manual refresh",
  "Auto-incident creation from monitoring failures",
  "Fast manual incident controls for operations teams",
  "Customer-facing public status with clear trust messaging",
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f8] text-zinc-900">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="text-base font-semibold text-zinc-900">
          StatusPal
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-zinc-700">
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center rounded-full bg-[#5f58f7] px-4 text-sm font-medium text-white hover:bg-[#544df1]"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-14 px-5 pb-16 sm:px-8">
        <RevealSection>
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
              How it works
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
              Understand everything your status platform does
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
              From service checks to incident response and public communication, this page
              explains exactly how the system works so your team can operate with confidence.
            </p>
          </section>
        </RevealSection>

        <RevealSection>
          <section className="grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => (
              <article
                key={item}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <p className="text-base font-medium text-zinc-800">{item}</p>
              </article>
            ))}
          </section>
        </RevealSection>

        <section className="space-y-4">
          {steps.map((step) => (
            <RevealSection key={step.title}>
              <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                  {step.title}
                </h2>
                <p className="mt-2 text-base leading-7 text-zinc-600">{step.description}</p>
              </article>
            </RevealSection>
          ))}
        </section>

        <RevealSection>
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
              What this gives your team
            </h2>
            <ul className="mt-4 space-y-3 text-zinc-700">
              <li>- Faster detection of downtime and degraded performance</li>
              <li>- Clear incident lifecycle from creation to resolution</li>
              <li>- A single operations hub for dashboard, services, and incidents</li>
              <li>- A trustworthy public status page for customer transparency</li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex h-11 items-center rounded-full bg-[#5f58f7] px-6 text-sm font-medium text-white hover:bg-[#544df1]"
              >
                Start your own status server
              </Link>
              <Link
                href="/status/demo"
                className="inline-flex h-11 items-center rounded-full border border-zinc-300 bg-white px-6 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                View public status example
              </Link>
            </div>
          </section>
        </RevealSection>
      </main>
    </div>
  );
}
