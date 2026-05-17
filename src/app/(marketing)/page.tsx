"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
// ScrollAnimatedBackground is mounted by the shared marketing layout

const brandName = "Slebb";
const publicDomain = "status.slebb.com";

/* ─── helpers ────────────────────────────────────────────────────── */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({
  children, delay = 0, from = "bottom", className = "",
}: {
  children: React.ReactNode; delay?: number; from?: "bottom" | "left" | "right"; className?: string;
}) {
  const { ref, visible } = useInView();
  const hidden =
    from === "left" ? "-translate-x-12 opacity-0" :
    from === "right" ? "translate-x-12 opacity-0" :
    "translate-y-10 opacity-0";
  return (
    <div
      ref={ref}
      className={["transition-all duration-700 ease-out", visible ? "translate-x-0 translate-y-0 opacity-100" : hidden, className].join(" ")}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── animated counter ─────────────────────────────────────────── */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const { ref, visible } = useInView(0.3);
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const dur = 1800;
    const steps = 60;
    const step = dur / steps;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setValue(Math.round(target * (i / steps)));
      if (i >= steps) clearInterval(id);
    }, step);
    return () => clearInterval(id);
  }, [visible, target]);
  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

/* ─── hero status mockup ────────────────────────────────────────── */
function LiveStatusMockup() {
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const [phase, setPhase] = useState(0); // 0=ok 1=incident 2=resolving

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 7000);
    const t2 = setTimeout(() => setPhase(2), 13000);
    const t3 = setTimeout(() => setPhase(0), 19000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const barCount = 44;
  const bars = Array.from({ length: barCount }, (_, i) => ({
    amber: i === 10 || i === 11,
    down: phase === 1 && i >= barCount - 2,
  }));

  if (!mounted) {
    return (
      <div className="relative w-full max-w-[500px]">
        <div className="rounded-2xl border border-white/10 bg-[#080c1e]/90" style={{ height: 320 }} />
      </div>
    );
  }

  const overall =
    phase === 0 ? { text: "✓ All systems operational", color: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.25)" } :
    phase === 1 ? { text: "⚠ Partial outage detected", color: "#f87171", bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.3)" } :
    { text: "↺ Monitoring — recovering", color: "#fbbf24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)" };

  return (
    <div className="relative w-full max-w-[500px] select-none">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#080c1e]/90 shadow-[0_0_80px_-20px_rgba(99,102,241,0.55)] backdrop-blur-sm">
        <div className="slebb-scan-line pointer-events-none absolute inset-0 z-10" />
        <div className="border-b border-white/8 px-5 py-4" style={{ background: "linear-gradient(180deg,rgba(99,102,241,0.18) 0%,transparent 100%)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="slebb-live-dot h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-zinc-200">Live monitor stream</span>
            </div>
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] text-zinc-400">{publicDomain}</span>
          </div>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div className="flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-700" style={{ background: overall.bg, border: `1px solid ${overall.border}` }}>
            <span className="text-sm font-semibold transition-colors duration-700" style={{ color: overall.color }}>{overall.text}</span>
            <span className="text-xs font-semibold tabular-nums text-zinc-400">99.97%</span>
          </div>
          {[
            { name: "Web App", ok: true },
            { name: "REST API", ok: phase !== 1 },
            { name: "Auth Service", ok: true },
            { name: "Workers", ok: phase !== 2 },
          ].map((svc) => (
            <div key={svc.name} className="flex items-center justify-between rounded-lg border border-white/6 bg-white/3 px-3 py-2">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full transition-all duration-700" style={{ background: svc.ok ? "#34d399" : "#f87171", boxShadow: `0 0 6px ${svc.ok ? "#34d399" : "#f87171"}` }} />
                <span className="text-xs font-medium text-zinc-200">{svc.name}</span>
              </div>
              <span className="text-[11px] font-semibold transition-colors duration-700" style={{ color: svc.ok ? "#34d399" : "#f87171" }}>
                {svc.ok ? "Operational" : phase === 1 ? "Investigating" : "Recovering"}
              </span>
            </div>
          ))}
          <div>
            <div className="mb-1.5 flex items-end gap-px" style={{ height: "40px" }}>
              {bars.map((b, i) => (
                <div
                  key={i}
                  suppressHydrationWarning
                  className="flex-1 rounded-[2px] transition-all duration-500"
                  style={{
                    background: b.down ? "#f87171" : b.amber ? "#fbbf24" : "#34d399",
                    height: `${24 + ((i * 7 + tick) % 14)}px`,
                    opacity: Math.round((0.75 + Math.sin(i * 0.6 + tick * 0.3) * 0.25) * 100) / 100,
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[9px] font-medium uppercase tracking-wider text-zinc-600"><span>60 days ago</span><span>Now</span></div>
          </div>
          <div className="overflow-hidden rounded-lg border border-white/6 bg-black/30">
            <div className="slebb-ticker whitespace-nowrap px-3 py-2 text-[10px] font-medium text-zinc-400">
              {phase === 1
                ? "⚠ API latency spike detected · Auto-incident created · Team notified · Investigating ·"
                : phase === 2
                  ? "↺ API recovering · Response times improving · Monitoring closely · Updates posted ·"
                  : "✓ All checks passed · 99.97% uptime (30d) · 0 open incidents · Next check in 28s ·"}
            </div>
          </div>
        </div>
      </div>
      <div className="slebb-float-a absolute -top-5 -left-8 hidden rounded-xl border border-white/10 bg-[#10132a]/90 px-3 py-2 text-[11px] font-semibold text-zinc-200 shadow-lg backdrop-blur-sm sm:block">
        <span className="mr-1.5 text-emerald-400">↑</span>Live checks every 30s
      </div>
      <div className="slebb-float-b absolute -bottom-5 -right-8 hidden rounded-xl border border-white/10 bg-[#10132a]/90 px-3 py-2 text-[11px] font-semibold text-zinc-200 shadow-lg backdrop-blur-sm sm:block">
        <span className="mr-1.5 text-violet-400">⬡</span>Auto incident timeline
      </div>
      <div className="slebb-float-c absolute top-16 -right-10 hidden rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-[11px] font-semibold text-cyan-200 backdrop-blur-sm lg:block">
        97 monitors active
      </div>
    </div>
  );
}

/* ─── uptime grid ───────────────────────────────────────────────── */
const GRID_ROWS = 8;
const GRID_COLS = 22;
const GRID_TOTAL = GRID_ROWS * GRID_COLS;

function UptimeGrid() {
  const { ref, visible } = useInView(0.2);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let i = 0;
    const id = setInterval(() => {
      i += 3;
      setLit(Math.min(i, GRID_TOTAL));
      if (i >= GRID_TOTAL) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [visible]);

  const cells = Array.from({ length: GRID_TOTAL }, (_, idx) => {
    const isLit = idx < lit;
    const color = idx === 42 || idx === 97 || idx === 133
      ? "#fbbf24"
      : idx === 60 || idx === 61
        ? "#f87171"
        : "#34d399";
    return { isLit, color, delay: idx * 6 };
  });

  return (
    <div ref={ref} className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#070b1c]/80 p-5 shadow-[0_0_60px_-20px_rgba(99,102,241,0.4)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-300">Uptime grid — last 90 days</span>
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">99.81% avg</span>
      </div>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}>
        {cells.map((c, i) => (
          <div
            key={i}
            className="rounded-[2px] transition-all"
            style={{
              height: "12px",
              background: c.isLit ? c.color : "rgba(255,255,255,0.05)",
              boxShadow: c.isLit ? `0 0 4px ${c.color}55` : "none",
              transitionDuration: "300ms",
              transitionDelay: c.isLit ? `${c.delay}ms` : "0ms",
            }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-400" />Operational</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400" />Degraded</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-rose-400" />Down</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-white/10" />No data</span>
      </div>
    </div>
  );
}

/* ─── animated uptime SVG chart ─────────────────────────────────── */
function UptimeChart() {
  const { ref, visible } = useInView(0.2);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let p = 0;
    const id = setInterval(() => {
      p += 2;
      setProgress(Math.min(p, 100));
      if (p >= 100) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [visible]);

  const W = 520, H = 100;
  const pts = [0, 92, 88, 95, 99, 100, 100, 97, 100, 100, 95, 98, 100, 100, 100, 100, 100];
  const svgPts = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * W;
    const y = H - (v / 100) * H * 0.85;
    return `${x},${y}`;
  });
  const visibleCount = Math.floor((progress / 100) * svgPts.length);
  const visiblePts = svgPts.slice(0, Math.max(2, visibleCount));
  const polyLine = visiblePts.join(" ");
  const fillPath = `M0,${H} L${polyLine} L${visiblePts[visiblePts.length - 1]?.split(",")[0] ?? 0},${H} Z`;

  return (
    <div ref={ref} className="overflow-hidden rounded-2xl border border-white/8 bg-[#070b1c]/80 p-5 shadow-[0_0_60px_-20px_rgba(52,211,153,0.3)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-300">Response time — last 30 days</span>
        <span className="text-[10px] font-bold text-emerald-300">avg 142ms</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 80 }}>
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#chartFill)" />
        <polyline points={polyLine} fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {visibleCount >= pts.length && (
          <circle cx={svgPts[svgPts.length - 1]?.split(",")[0]} cy={svgPts[svgPts.length - 1]?.split(",")[1]} r="4" fill="#34d399" />
        )}
      </svg>
      <div className="mt-2 flex justify-between text-[9px] font-medium uppercase tracking-wider text-zinc-600">
        <span>30 days ago</span><span>Today</span>
      </div>
    </div>
  );
}

/* ─── incident timeline ─────────────────────────────────────────── */
const TIMELINE = [
  { time: "09:42", icon: "◉", color: "#f87171", label: "Outage detected", sub: "API health check failed × 3 consecutive" },
  { time: "09:43", icon: "⚡", color: "#fbbf24", label: "Incident created", sub: "Auto-created, severity: major" },
  { time: "09:44", icon: "📣", color: "#a78bfa", label: "Team notified", sub: "Discord + email alerts sent to on-call" },
  { time: "09:51", icon: "🔍", color: "#60a5fa", label: "Root cause found", sub: "Database connection pool exhausted" },
  { time: "10:03", icon: "⚙", color: "#34d399", label: "Fix deployed", sub: "Pool size increased, services restarting" },
  { time: "10:07", icon: "✓", color: "#34d399", label: "Resolved", sub: "All monitors green · downtime: 25 min" },
];

function IncidentTimeline() {
  const { ref, visible } = useInView(0.1);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(i);
      if (i >= TIMELINE.length) clearInterval(id);
    }, 400);
    return () => clearInterval(id);
  }, [visible]);

  return (
    <div ref={ref} className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#070b1c]/80 p-5 shadow-[0_0_60px_-20px_rgba(139,92,246,0.35)]">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-300">Live incident timeline</span>
        <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">Resolved in 25m</span>
      </div>
      <div className="relative space-y-0">
        <div className="absolute left-[26px] top-0 bottom-0 w-px bg-white/8" />
        {TIMELINE.map((ev, i) => (
          <div
            key={i}
            className="relative flex items-start gap-4 py-2 transition-all duration-500"
            style={{ opacity: i < shown ? 1 : 0, transform: i < shown ? "translateX(0)" : "translateX(-12px)" }}
          >
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#0d1128] text-sm" style={{ color: ev.color }}>
              {ev.icon}
            </div>
            <div className="min-w-0 pt-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-zinc-100">{ev.label}</span>
                <span className="text-[10px] tabular-nums text-zinc-600">{ev.time}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-500">{ev.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── feature row (alternate left/right) ────────────────────────── */
function FeatureRow({
  icon, label, title, body, visual, reverse = false,
}: {
  icon: string; label: string; title: string; body: string;
  visual: React.ReactNode; reverse?: boolean;
}) {
  return (
    <div className={`grid items-center gap-10 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
      <Reveal from={reverse ? "right" : "left"}>
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">{label}</span>
          <h3 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{title}</h3>
          <p className="mt-3 max-w-md text-base leading-7 text-zinc-400">{body}</p>
        </div>
      </Reveal>
      <Reveal from={reverse ? "left" : "right"} delay={120}>
        <div className="text-3xl">{icon}</div>
        {visual}
      </Reveal>
    </div>
  );
}

/* ─── page ──────────────────────────────────────────────────────── */
export default function MarketingPage() {
  return (
    <div className="text-zinc-100">
      <div>
        {/* ── Hero ── */}
        <main className="mx-auto grid w-full max-w-7xl gap-12 px-5 pt-10 pb-20 sm:px-8 sm:pt-16 lg:grid-cols-2 lg:items-center lg:gap-20 lg:pt-20">
          <section className="max-w-[580px]">
            <div className="slebb-badge inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300">
              <span className="slebb-live-dot h-1.5 w-1.5 rounded-full bg-indigo-400" />
              Real-time status communication
            </div>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-[3.8rem]">
              <span className="slebb-gradient-heading">{brandName}</span> — status pages<br />
              that feel <span className="slebb-gradient-heading">alive</span>
            </h1>
            <p className="mt-3 text-sm font-medium text-zinc-500">CTOs · DevOps/SRE · Support Engineers</p>
            <p className="mt-4 max-w-lg text-lg leading-8 text-zinc-300">
              Launch a stunning public status experience on <strong className="text-white">{publicDomain}</strong>.
              Auto-incident timelines, live uptime charts, and updates your users instantly trust.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register" className="slebb-cta-primary inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-7 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-400 hover:to-violet-500">
                Get started free
              </Link>
              <Link href="/how-it-works" className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-7 text-sm font-medium text-zinc-300 transition hover:border-white/30 hover:text-white">
                See how it works
              </Link>
            </div>
          </section>
          <section className="flex justify-center pt-4 lg:justify-end lg:pt-0">
            <LiveStatusMockup />
          </section>
        </main>

        {/* ── Stats ── */}
        <section className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8">
          <Reveal>
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/8 bg-white/3 p-6 sm:grid-cols-4">
              {[
                { label: "Avg uptime", value: <Counter target={99} suffix=".97%" /> },
                { label: "Monitors running", value: <Counter target={1240} /> },
                { label: "Incidents resolved", value: <Counter target={8430} /> },
                { label: "Alerts sent", value: <Counter target={54000} /> },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-extrabold tabular-nums text-white sm:text-3xl">{s.value}</p>
                  <p className="mt-1 text-xs font-medium text-zinc-500">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── Uptime grid ── */}
        <section className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">Visual uptime history</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Every check. Every day.</h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-zinc-400">
              Each cell is one day of monitoring. Watch your history come to life as you scroll.
            </p>
          </Reveal>
          <div className="mt-8">
            <UptimeGrid />
          </div>
        </section>

        {/* ── Feature rows ── */}
        <section className="mx-auto w-full max-w-7xl space-y-24 px-5 py-14 sm:px-8">
          <FeatureRow
            label="Automated incident management"
            title="Incidents create, update, and close themselves"
            body="When a monitor fails, Slebb auto-creates an incident, notifies your team, and tracks every update — so you can focus on fixing, not communicating."
            icon=""
            visual={<IncidentTimeline />}
          />
          <FeatureRow
            reverse
            label="Transparent uptime history"
            title="Your users deserve real numbers"
            body="Show a live response-time chart and day-by-day uptime grid. No vague 'service unavailable' pages — just honest, beautiful data."
            icon=""
            visual={
              <div className="space-y-4">
                <UptimeChart />
                <UptimeGrid />
              </div>
            }
          />
        </section>

        {/* ── Incident flow steps ── */}
        <section className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">Incident flow</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">From detection to resolution</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: 1, label: "Detect", color: "#f87171", desc: "Health check detects degradation in real time." },
              { n: 2, label: "Alert",  color: "#fbbf24", desc: "Incident auto-created. Team notified via Discord / email." },
              { n: 3, label: "Update", color: "#60a5fa", desc: "Post updates as you investigate. Status page refreshes live." },
              { n: 4, label: "Resolve",color: "#34d399", desc: "Close the incident. History published automatically." },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 100}>
                <div className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-5 transition-all hover:border-white/15 hover:bg-white/5">
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${s.color}66,transparent)` }} />
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold" style={{ background: `${s.color}22`, color: s.color }}>{s.n}</span>
                  <p className="mt-3 text-sm font-bold text-zinc-100">{s.label}</p>
                  <p className="mt-1.5 text-sm leading-6 text-zinc-500">{s.desc}</p>
                  {i < 3 && <span className="absolute -right-1.5 top-8 hidden text-zinc-600 lg:block">→</span>}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Feature highlights ── */}
        <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "⬡", title: "HTTP health checks", desc: "Pick interval, timeout, and failure threshold per monitor." },
              { icon: "◈", title: "Clear status pages", desc: "Clean public page on your own domain — no jargon." },
              { icon: "◎", title: "Instant alerts", desc: "Discord and email alerts the moment something breaks." },
              { icon: "◉", title: "Honest incident flow", desc: "Investigating → Monitoring → Resolved. Clear for everyone." },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="group rounded-2xl border border-white/8 bg-white/3 p-5 transition-all duration-300 hover:border-indigo-400/30 hover:bg-white/5 hover:shadow-[0_0_32px_-8px_rgba(99,102,241,0.3)]">
                  <span className="text-2xl text-indigo-400">{item.icon}</span>
                  <p className="mt-3 text-sm font-semibold text-zinc-100">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8">
          <Reveal>
            <div className="overflow-hidden rounded-3xl border border-indigo-400/15 bg-gradient-to-br from-indigo-500/10 via-violet-500/8 to-cyan-500/6 p-10 shadow-[0_0_80px_-20px_rgba(99,102,241,0.4)] sm:p-14">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">Ready to launch?</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
                Your status page,<br /><span className="slebb-gradient-heading">live in minutes.</span>
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
                Set up monitoring, connect your custom domain, and give your users the transparent status experience they deserve.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="inline-flex h-12 items-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-7 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-400 hover:to-violet-500">
                  Create your account — it's free
                </Link>
                <Link href="/contact" className="inline-flex h-12 items-center rounded-full border border-white/15 px-7 text-sm font-medium text-zinc-300 transition hover:border-white/30 hover:text-white">
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
