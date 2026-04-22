"use client";

import type { UIMonitorTypeId } from "@/components/services/add-monitor/monitor-type-defs";

const accentIconBg: Record<
  UIMonitorTypeId,
  string
> = {
  website: "from-sky-500/30 to-cyan-600/20 text-cyan-200",
  api: "from-violet-500/30 to-fuchsia-600/20 text-violet-200",
  ping: "from-emerald-500/30 to-teal-600/20 text-emerald-200",
  cron: "from-amber-500/20 to-orange-600/10 text-amber-200/80",
  tcp: "from-rose-500/20 to-orange-500/10 text-rose-200/70",
  udp: "from-indigo-500/20 to-violet-500/10 text-indigo-200/70",
  dns: "from-blue-500/20 to-cyan-500/10 text-blue-200/70",
};

type MonitorTypeCardProps = {
  id: UIMonitorTypeId;
  title: string;
  description: string;
  available: boolean;
  selected: boolean;
  icon: React.ReactNode;
  onSelect: (id: UIMonitorTypeId) => void;
};

export function MonitorTypeCard({
  id,
  title,
  description,
  available,
  selected,
  icon,
  onSelect,
}: MonitorTypeCardProps) {
  return (
    <button
      type="button"
      disabled={!available}
      onClick={() => available && onSelect(id)}
      className={[
        "group relative flex w-full text-left transition-all duration-200",
        "rounded-2xl border p-3 sm:p-3.5",
        !available
          ? "cursor-not-allowed border-white/[0.06] bg-white/[0.02] opacity-50"
          : "cursor-pointer",
        available && !selected && "border-[#1C2330] bg-[#0B0F14] hover:scale-[1.02] hover:border-cyan-500/30 hover:shadow-[0_0_20px_-6px_rgba(34,211,238,0.25)]",
        available && selected && "border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_24px_-8px_rgba(6,182,212,0.35)]",
      ].join(" ")}
    >
      <div className="flex gap-2.5 sm:gap-3">
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-white/10",
            accentIconBg[id],
          ].join(" ")}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-100">{title}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-500 sm:text-xs">{description}</p>
        </div>
        {selected && available ? (
          <span
            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
            aria-hidden
          />
        ) : null}
      </div>
      {!available ? (
        <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">Soon</p>
      ) : null}
    </button>
  );
}
