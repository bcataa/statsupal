import Link from "next/link";
import { RevealSection } from "@/components/marketing/reveal-section";

const features = [
  {
    icon: "◈",
    color: "#818cf8",
    title: "Status Pages",
    description: "Publish customer-facing status pages with clean uptime, incident history, and live visuals on your own domain.",
  },
  {
    icon: "◉",
    color: "#f87171",
    title: "Incident Management",
    description: "Create incidents manually or from monitoring signals, then move through a clear resolution workflow.",
  },
  {
    icon: "⬡",
    color: "#34d399",
    title: "Monitoring",
    description: "Track services with continuous HTTP checks and live health updates for every endpoint.",
  },
  {
    icon: "◎",
    color: "#60a5fa",
    title: "Operational Dashboard",
    description: "See services, incidents, and performance summaries in one central operations console.",
  },
];

export default function ProductPage() {
  return (
    <main className="px-5 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <RevealSection>
          <header className="overflow-hidden rounded-3xl border border-white/8 p-8 sm:p-10" style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.12) 0%,rgba(139,92,246,0.07) 100%)" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">Product</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Built for reliable incident communication
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
              Slebb gives your team a focused platform to monitor services, communicate
              outages clearly, and keep customers informed in real time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex h-11 items-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-violet-500">
                Get started free
              </Link>
              <Link href="/" className="inline-flex h-11 items-center rounded-full border border-white/15 px-6 text-sm font-medium text-zinc-300 transition hover:border-white/30 hover:text-white">
                Back home
              </Link>
            </div>
          </header>
        </RevealSection>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f, i) => (
            <RevealSection key={f.title}>
              <article className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-6 transition hover:border-white/15 hover:bg-white/5">
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${f.color}55,transparent)` }} />
                <span className="text-2xl" style={{ color: f.color }}>{f.icon}</span>
                <h2 className="mt-3 text-lg font-bold text-white">{f.title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{f.description}</p>
              </article>
            </RevealSection>
          ))}
        </div>
      </div>
    </main>
  );
}
