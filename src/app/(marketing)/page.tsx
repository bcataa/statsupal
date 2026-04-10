import Link from "next/link";
import { RevealSection } from "@/components/marketing/reveal-section";

const highlights = [
  {
    title: "HTTP health checks",
    description:
      "Pick how often to check each URL, how long to wait, and how many failures open an incident.",
  },
  {
    title: "Clear status pages",
    description:
      "Share a simple public page visitors understand—no jargon, just what is up and what is not.",
  },
  {
    title: "Alerts that fit your stack",
    description:
      "Optional Discord and email so the right people hear about problems quickly.",
  },
  {
    title: "Honest incident flow",
    description:
      "Track investigating, monitoring, and resolved states so communication stays consistent.",
  },
];

const pillars = [
  {
    title: "Detect problems fast",
    description:
      "Automatic health checks identify outages and degraded performance before customers escalate.",
  },
  {
    title: "Respond with confidence",
    description:
      "Run a clean incident workflow with clear statuses, timestamps, and team-friendly updates.",
  },
  {
    title: "Build customer trust",
    description:
      "Publish transparent updates on a public status page that looks professional and reliable.",
  },
];

const flowSteps = [
  "Monitoring check detects service degradation",
  "Incident is auto-created and marked investigating",
  "Team posts updates and moves status to monitoring",
  "Incident is resolved and published to history",
];

function StatusPreviewCard() {
  return (
    <div className="relative w-full max-w-[430px] rounded-2xl border border-indigo-900/60 bg-[#060a24] p-3 shadow-2xl shadow-indigo-950/30">
      <div className="rounded-xl border border-indigo-500/25 bg-[#070d2c] p-4">
        <div className="flex items-center justify-between">
          <div className="h-2 w-2 rounded-full bg-cyan-400" />
          <p className="text-[11px] text-zinc-400">Subscribe to updates</p>
        </div>

        <div className="mt-4 rounded-md bg-emerald-500/90 py-1.5 text-center text-xs font-medium text-emerald-950">
          All systems operational
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between rounded-md border border-indigo-400/20 px-2 py-1.5">
            <p className="text-[11px] text-zinc-300">Web</p>
            <p className="text-[11px] text-emerald-300">Operational</p>
          </div>
          <div className="flex items-center justify-between rounded-md border border-indigo-400/20 px-2 py-1.5">
            <p className="text-[11px] text-zinc-300">API</p>
            <p className="text-[11px] text-emerald-300">Operational</p>
          </div>
        </div>

        <div className="mt-4 flex gap-1">
          {Array.from({ length: 34 }).map((_, idx) => (
            <span
              key={idx}
              className={[
                "h-6 w-2 rounded-sm",
                idx === 8 || idx === 20
                  ? "bg-amber-400/90"
                  : "bg-emerald-400/85",
              ].join(" ")}
            />
          ))}
        </div>

        <div className="mt-4 h-24 rounded-md border border-indigo-400/20 bg-gradient-to-b from-indigo-900/30 to-transparent p-2">
          <div className="h-full w-full rounded bg-[linear-gradient(180deg,rgba(99,102,241,0.35)_0%,rgba(15,23,42,0.1)_100%)]" />
        </div>
      </div>
    </div>
  );
}

export default function MarketingPage() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute top-0 left-0 h-80 w-80 rounded-full bg-violet-300/25 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />

      <main className="relative mx-auto grid w-full max-w-7xl gap-10 px-5 pt-8 pb-14 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pt-12">
        <section className="max-w-[540px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            Built for clear uptime communication
            <span className="text-indigo-500">→</span>
          </div>

          <h1 className="mt-5 text-5xl font-semibold leading-[0.95] tracking-tight text-zinc-900 sm:text-6xl">
            Incident communication made easy
          </h1>

          <p className="mt-5 text-sm font-medium text-zinc-600">
            CTOs • DevOps/SRE • Support Engineers
          </p>
          <p className="mt-4 max-w-lg text-xl leading-8 text-zinc-700">
            Save time and maintain user trust during the most critical times.
            Communicate about incidents &amp; maintenance effectively.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <Link
              href="/register"
              className="inline-flex h-12 items-center rounded-full bg-[#5f58f7] px-7 text-base font-medium text-white shadow-md shadow-indigo-400/30 transition hover:bg-[#544df1]"
            >
              Get started
            </Link>
            <Link href="/contact" className="inline-flex h-12 items-center rounded-full border border-zinc-300 bg-white px-7 text-base font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50">
              Contact support
            </Link>
          </div>
          <div className="mt-4">
            <Link href="/how-it-works" className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline">
              See exactly how it works
            </Link>
          </div>
        </section>

        <section className="relative flex justify-center lg:justify-end">
          <div className="absolute inset-y-5 right-0 hidden w-[92%] rounded-3xl border border-zinc-200 bg-white/50 lg:block">
            <div className="space-y-6 px-10 py-9">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-3 rounded-full bg-zinc-200/70" />
              ))}
            </div>
          </div>

          <div className="relative z-10 w-full max-w-[440px] rounded-3xl bg-gradient-to-br from-white/70 to-white/30 p-2 backdrop-blur-sm lg:translate-x-2">
            <div className="marketing-float absolute -top-4 -left-6 hidden rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm sm:block">
              Live checks every 60s
            </div>
            <div className="marketing-float-delayed absolute -right-5 -bottom-4 hidden rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm sm:block">
              Auto incident creation
            </div>
            <StatusPreviewCard />
          </div>
        </section>
      </main>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-5 pb-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {highlights.map((item) => (
          <RevealSection key={item.title}>
            <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-base font-semibold tracking-tight text-zinc-900">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{item.description}</p>
            </article>
          </RevealSection>
        ))}
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <RevealSection>
          <div className="mb-6">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Built for operational clarity
            </h2>
            <p className="mt-2 max-w-3xl text-base leading-7 text-zinc-600">
              Every part of the product is designed to help your team move from detection
              to communication quickly, without chaos.
            </p>
          </div>
        </RevealSection>
        <div className="grid gap-4 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <RevealSection key={pillar.title}>
              <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-zinc-900">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{pillar.description}</p>
              </article>
            </RevealSection>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <RevealSection>
          <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
              Incident flow
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              How the platform works in real incidents
            </h2>
            <div className="mt-6 space-y-3">
              {flowSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3"
                >
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                    {index + 1}
                  </span>
                  <p className="text-sm text-zinc-700">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pt-2 pb-14 sm:px-8">
        <RevealSection>
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              <span className="marketing-gradient-text">Ready for production-grade status communication?</span>
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
              Launch your own status workflow in minutes and keep your customers updated with confidence.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex h-11 items-center rounded-full bg-[#5f58f7] px-6 text-sm font-medium text-white hover:bg-[#544df1]"
              >
                Create your account
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex h-11 items-center rounded-full border border-zinc-300 bg-white px-6 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Explore full workflow
              </Link>
            </div>
          </div>
        </RevealSection>
      </section>

      <footer className="mx-auto w-full max-w-7xl border-t border-zinc-200 px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-3 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-zinc-800">Statsupal</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/privacy" className="hover:text-zinc-900">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-zinc-900">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-zinc-900">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

