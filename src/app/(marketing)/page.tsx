"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ScrollAnimatedBackground } from "@/components/marketing/scroll-animated-background";

const brandName = "Slebb";
const publicDomain = "status.slebb.com";

const highlights = [
  {
    icon: "⬡",
    title: "HTTP health checks",
    description: "Pick how often to check each URL, how long to wait, and how many failures open an incident.",
  },
  {
    icon: "◈",
    title: "Clear status pages",
    description: "Share a clean public page visitors understand — no jargon, just what is up and what is not.",
  },
  {
    icon: "◎",
    title: "Alerts that fit your stack",
    description: "Discord and email so the right people hear about problems instantly.",
  },
  {
    icon: "◉",
    title: "Honest incident flow",
    description: "Track investigating, monitoring, and resolved states so communication stays consistent.",
  },
];

const flowSteps = [
  { label: "Detect", desc: "Health check detects service degradation in real time." },
  { label: "Alert", desc: "Incident auto-created — team notified via Discord / email." },
  { label: "Update", desc: "Post clear updates as you investigate. Status page updates live." },
  { label: "Resolve", desc: "Close the incident. History published automatically." },
];

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={[
        "transition-all duration-700 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0",
        className,
      ].join(" ")}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function LiveStatusMockup() {
  const [tick, setTick] = useState(0);
  const [incident, setIncident] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setIncident(true), 8000);
    const id2 = setTimeout(() => setIncident(false), 14000);
    return () => {
      clearTimeout(id);
      clearTimeout(id2);
    };
  }, []);

  const barCount = 44;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const isAmber = i === 10 || i === 11;
    const isDown = incident && (i === barCount - 2 || i === barCount - 1);
    return { isAmber, isDown };
  });

  return (
    <div className="relative w-full max-w-[500px] select-none">
      <div className="slebb-hero-card absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/8 via-violet-500/6 to-transparent" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#080c1e]/90 shadow-[0_0_80px_-20px_rgba(99,102,241,0.55)] backdrop-blur-sm">
        <div className="slebb-scan-line pointer-events-none absolute inset-0 z-10" />

        <div
          className="border-b border-white/8 px-5 py-4"
          style={{ background: "linear-gradient(180deg,rgba(99,102,241,0.18) 0%,transparent 100%)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="slebb-live-dot h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold tracking-wide text-zinc-200">Live monitor stream</span>
            </div>
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
              {publicDomain}
            </span>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div
            className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors duration-700"
            style={{
              background: incident
                ? "rgba(248,113,113,0.15)"
                : "rgba(52,211,153,0.12)",
              border: incident
                ? "1px solid rgba(248,113,113,0.3)"
                : "1px solid rgba(52,211,153,0.25)",
            }}
          >
            <span
              className="text-sm font-semibold transition-colors duration-700"
              style={{ color: incident ? "#f87171" : "#34d399" }}
            >
              {incident ? "⚠ Partial outage detected" : "✓ All systems operational"}
            </span>
            <span className="text-xs font-semibold tabular-nums text-zinc-400">99.97%</span>
          </div>

          {[
            { name: "Web App", ok: true },
            { name: "REST API", ok: !incident },
            { name: "Auth Service", ok: true },
            { name: "Workers", ok: true },
          ].map((svc) => (
            <div key={svc.name} className="flex items-center justify-between rounded-lg border border-white/6 bg-white/3 px-3 py-2">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2 w-2 rounded-full transition-colors duration-700"
                  style={{ background: svc.ok ? "#34d399" : "#f87171", boxShadow: `0 0 6px ${svc.ok ? "#34d399" : "#f87171"}` }}
                />
                <span className="text-xs font-medium text-zinc-200">{svc.name}</span>
              </div>
              <span
                className="text-[11px] font-semibold transition-colors duration-700"
                style={{ color: svc.ok ? "#34d399" : "#f87171" }}
              >
                {svc.ok ? "Operational" : "Investigating"}
              </span>
            </div>
          ))}

          <div>
            <div className="mb-1.5 flex items-end gap-px" style={{ height: "40px" }}>
              {bars.map((b, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-[2px] transition-all duration-500"
                  style={{
                    background: b.isDown ? "#f87171" : b.isAmber ? "#fbbf24" : "#34d399",
                    height: `${24 + ((i * 7 + tick) % 14)}px`,
                    opacity: 0.8 + Math.sin(i * 0.6 + tick * 0.3) * 0.2,
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[9px] font-medium uppercase tracking-wider text-zinc-600">
              <span>60 days ago</span>
              <span>Now</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-white/6 bg-black/30">
            <div className="slebb-ticker whitespace-nowrap px-3 py-2 text-[10px] font-medium text-zinc-400">
              {incident
                ? "⚠ API latency spike detected · Auto-incident created · Team notified · Investigating ·"
                : "✓ All checks passed · 99.97% uptime (30d) · 0 open incidents · Next check in 28s ·"}
            </div>
          </div>
        </div>
      </div>

      <div className="slebb-float-a absolute -top-5 -left-8 hidden rounded-xl border border-white/10 bg-[#10132a]/90 px-3 py-2 text-[11px] font-semibold text-zinc-200 shadow-lg shadow-black/40 backdrop-blur-sm sm:block">
        <span className="mr-1.5 text-emerald-400">↑</span>Live checks every 30s
      </div>
      <div className="slebb-float-b absolute -bottom-5 -right-8 hidden rounded-xl border border-white/10 bg-[#10132a]/90 px-3 py-2 text-[11px] font-semibold text-zinc-200 shadow-lg shadow-black/40 backdrop-blur-sm sm:block">
        <span className="mr-1.5 text-violet-400">⬡</span>Auto incident timeline
      </div>
      <div className="slebb-float-c absolute top-16 -right-10 hidden rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-[11px] font-semibold text-cyan-200 shadow-lg backdrop-blur-sm lg:block">
        97 monitors active
      </div>
    </div>
  );
}

export default function MarketingPage() {
  return (
    <div className="relative isolate min-h-screen text-zinc-100">
      <ScrollAnimatedBackground />

      <div className="relative z-10">
        <main className="mx-auto grid w-full max-w-7xl gap-12 px-5 pt-8 pb-14 sm:px-8 sm:pt-12 lg:grid-cols-2 lg:items-center lg:gap-20 lg:pt-16">
          <section className="max-w-[580px]">
            <div className="slebb-badge inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300">
              <span className="slebb-live-dot h-1.5 w-1.5 rounded-full bg-indigo-400" />
              Built for clear uptime communication
            </div>

            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl">
              <span className="slebb-gradient-heading">{brandName}</span> makes status<br />
              communication look{" "}
              <span className="slebb-gradient-heading">premium</span>
            </h1>

            <p className="mt-3 text-sm font-medium text-zinc-500">
              CTOs · DevOps/SRE · Support Engineers
            </p>
            <p className="mt-4 max-w-lg text-lg leading-8 text-zinc-300">
              Launch a stunning public status page on your own domain.
              Real-time visuals, auto incident timelines, and updates
              your users instantly trust.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="slebb-cta-primary inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-7 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-400 hover:to-violet-500 hover:shadow-indigo-400/40"
              >
                Get started free
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-7 text-sm font-medium text-zinc-300 transition hover:border-white/30 hover:text-white"
              >
                See how it works
              </Link>
            </div>
          </section>

          <section className="flex justify-center pt-4 lg:justify-end lg:pt-0">
            <LiveStatusMockup />
          </section>
        </main>

        <section className="mx-auto w-full max-w-7xl px-5 pb-10 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="slebb-feature-card group rounded-2xl border border-white/8 bg-white/3 p-5 transition-all duration-300 hover:border-indigo-400/30 hover:bg-white/5 hover:shadow-[0_0_32px_-8px_rgba(99,102,241,0.3)]">
                  <span className="text-2xl text-indigo-400">{item.icon}</span>
                  <p className="mt-3 text-sm font-semibold text-zinc-100">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">Incident flow</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From detection to resolution
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {flowSteps.map((step, i) => (
              <Reveal key={step.label} delay={i * 100}>
                <div className="relative rounded-2xl border border-white/8 bg-white/3 p-5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-300">
                    {i + 1}
                  </span>
                  <p className="mt-3 text-sm font-bold text-zinc-100">{step.label}</p>
                  <p className="mt-1.5 text-sm leading-6 text-zinc-500">{step.desc}</p>
                  {i < flowSteps.length - 1 && (
                    <span className="absolute -right-2 top-8 hidden text-zinc-600 lg:block">→</span>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
          <Reveal>
            <div className="overflow-hidden rounded-3xl border border-indigo-400/15 bg-gradient-to-br from-indigo-500/10 via-violet-500/8 to-cyan-500/6 p-8 shadow-[0_0_80px_-20px_rgba(99,102,241,0.35)] sm:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                Production-grade status communication
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                Ready to launch{" "}
                <span className="slebb-gradient-heading">in minutes?</span>
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
                Set up monitoring, configure your status page domain, and go live.
                Your users will thank you.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-7 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-400 hover:to-violet-500"
                >
                  Create your account
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center rounded-full border border-white/15 px-7 text-sm font-medium text-zinc-300 transition hover:border-white/30 hover:text-white"
                >
                  Contact us
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

        <footer className="mx-auto w-full max-w-7xl border-t border-white/8 px-5 py-8 sm:px-8">
          <div className="flex flex-col gap-3 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[9px] font-bold text-white">S</span>
              <span className="font-semibold text-zinc-300">{brandName}</span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/privacy" className="hover:text-zinc-200">Privacy</Link>
              <Link href="/terms" className="hover:text-zinc-200">Terms</Link>
              <Link href="/contact" className="hover:text-zinc-200">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
