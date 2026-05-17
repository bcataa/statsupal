import Link from "next/link";
import { RevealSection } from "@/components/marketing/reveal-section";

const steps = [
  {
    n: 1,
    title: "Connect your services",
    description: "Add your APIs, websites, and internal endpoints with check intervals and monitoring types.",
    color: "#818cf8",
  },
  {
    n: 2,
    title: "Monitor in real time",
    description: "Automatic HTTP checks run continuously and update operational, degraded, or down states.",
    color: "#34d399",
  },
  {
    n: 3,
    title: "Auto-detect incidents",
    description: "When checks fail, incidents are created automatically and linked to affected services.",
    color: "#f87171",
  },
  {
    n: 4,
    title: "Communicate clearly",
    description: "Share updates on your public status page with active and resolved incidents in a trustworthy format.",
    color: "#60a5fa",
  },
  {
    n: 5,
    title: "Resolve and recover",
    description: "Mark incidents through investigating, identified, monitoring, and resolved with clear history.",
    color: "#34d399",
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
    <main className="mx-auto w-full max-w-6xl space-y-10 px-5 py-10 pb-20 sm:px-8">
      <RevealSection>
        <section className="overflow-hidden rounded-3xl border border-white/8 bg-white/3 p-8 shadow-[0_0_60px_-20px_rgba(99,102,241,0.3)] sm:p-10" style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.1) 0%,rgba(139,92,246,0.06) 100%)" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">How it works</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Understand everything your<br className="hidden sm:block" /> status platform does
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
            From service checks to incident response and public communication, this page
            explains exactly how the system works so your team can operate with confidence.
          </p>
        </section>
      </RevealSection>

      <RevealSection>
        <section className="grid gap-3 sm:grid-cols-2">
          {highlights.map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/3 px-5 py-4 transition hover:border-indigo-400/30 hover:bg-white/5">
              <span className="mt-0.5 text-emerald-400">✓</span>
              <p className="text-sm font-medium text-zinc-200">{item}</p>
            </div>
          ))}
        </section>
      </RevealSection>

      <section className="space-y-4">
        {steps.map((step) => (
          <RevealSection key={step.n}>
            <article className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-6 transition hover:border-white/15 hover:bg-white/5">
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${step.color}55,transparent)` }} />
              <div className="flex items-start gap-4">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: `${step.color}22`, color: step.color }}>
                  {step.n}
                </span>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">{step.title}</h2>
                  <p className="mt-2 text-base leading-7 text-zinc-400">{step.description}</p>
                </div>
              </div>
            </article>
          </RevealSection>
        ))}
      </section>

      <RevealSection>
        <section className="overflow-hidden rounded-3xl border border-indigo-400/15 bg-gradient-to-br from-indigo-500/10 via-violet-500/8 to-transparent p-8 shadow-[0_0_60px_-20px_rgba(99,102,241,0.35)] sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">What this gives your team</h2>
          <ul className="mt-5 space-y-3">
            {[
              "Faster detection of downtime and degraded performance",
              "Clear incident lifecycle from creation to resolution",
              "A single operations hub for monitors, services, and incidents",
              "A trustworthy public status page for customer transparency",
            ].map((li) => (
              <li key={li} className="flex items-start gap-3 text-zinc-300">
                <span className="mt-0.5 text-indigo-400">→</span>
                {li}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex h-11 items-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-violet-500">
              Start your own status page
            </Link>
            <Link href="/showcase" className="inline-flex h-11 items-center rounded-full border border-white/15 px-6 text-sm font-medium text-zinc-300 transition hover:border-white/30 hover:text-white">
              View public status example
            </Link>
          </div>
        </section>
      </RevealSection>
    </main>
  );
}
