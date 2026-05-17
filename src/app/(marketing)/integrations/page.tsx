import Link from "next/link";
import { RevealSection } from "@/components/marketing/reveal-section";

const integrations = [
  { icon: "💬", color: "#818cf8", name: "Slack",          detail: "Send incident updates to on-call and stakeholder channels instantly." },
  { icon: "🎮", color: "#7c85f5", name: "Discord",        detail: "Broadcast service health and outage notifications to your server." },
  { icon: "⚡", color: "#fbbf24", name: "Webhook",        detail: "Trigger external automations on any status or incident change." },
  { icon: "✉",  color: "#34d399", name: "Email",          detail: "Notify subscribers with structured, readable incident communication." },
  { icon: "◎",  color: "#60a5fa", name: "API",            detail: "Programmatically manage services, incidents, and status pages." },
  { icon: "◈",  color: "#a78bfa", name: "Status Imports", detail: "Import data from existing status platforms in minutes." },
];

export default function IntegrationsPage() {
  return (
    <main className="px-5 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <RevealSection>
          <header className="overflow-hidden rounded-3xl border border-white/8 p-8 sm:p-10" style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.12) 0%,rgba(139,92,246,0.07) 100%)" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">Integrations</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Connect status workflows<br className="hidden sm:block" /> with your stack
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
              Plug incident communication into the tools your team already uses for
              operations, alerting, and customer messaging.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex h-11 items-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-violet-500">
                Get started
              </Link>
              <Link href="/" className="inline-flex h-11 items-center rounded-full border border-white/15 px-6 text-sm font-medium text-zinc-300 transition hover:border-white/30 hover:text-white">
                Back home
              </Link>
            </div>
          </header>
        </RevealSection>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((intg) => (
            <RevealSection key={intg.name}>
              <article className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-5 transition hover:border-white/15 hover:bg-white/5">
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${intg.color}55,transparent)` }} />
                <span className="text-2xl">{intg.icon}</span>
                <h2 className="mt-3 text-base font-bold text-white">{intg.name}</h2>
                <p className="mt-1.5 text-sm leading-6 text-zinc-400">{intg.detail}</p>
              </article>
            </RevealSection>
          ))}
        </div>
      </div>
    </main>
  );
}
