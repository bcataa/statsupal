"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatTimestampOrText } from "@/lib/utils/date-time";

type MonitorLatencyTooltipProps = {
  anchorRef: React.RefObject<HTMLElement | null>;
  show: boolean;
  latencyMs: number;
  regionLabel: string;
  lastCheckIso: string;
  statusLabel: string;
  statusTone: "ok" | "warn" | "down" | "pending";
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function MonitorLatencyTooltip({
  anchorRef,
  show,
  latencyMs,
  regionLabel,
  lastCheckIso,
  statusLabel,
  statusTone,
}: MonitorLatencyTooltipProps) {
  const [pos, setPos] = useState({ top: 0, left: 0, placement: "top" as "top" | "bottom" });

  useEffect(() => {
    if (!show) {
      return;
    }
    const el = anchorRef.current;
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const tw = 240;
    const th = 120;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement: "top" | "bottom" = spaceAbove > th + 12 || spaceBelow < th / 2 ? "top" : "bottom";
    const top =
      placement === "top"
        ? rect.top - th - 8
        : rect.bottom + 8;
    const left = clamp(
      rect.left + rect.width / 2 - tw / 2,
      8,
      window.innerWidth - tw - 8,
    );
    setPos({ top, left, placement });
  }, [show, anchorRef]);

  if (!show || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-none fixed z-[90] w-[15rem] rounded-xl border border-cyan-500/20 bg-[#0d0f14]/95 p-3 text-left text-xs shadow-[0_8px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/5 backdrop-blur-md transition-opacity duration-150"
      style={{
        top: pos.top,
        left: pos.left,
        opacity: show ? 1 : 0,
        visibility: show ? "visible" : "hidden",
      }}
      role="tooltip"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          {regionLabel}
        </p>
        <span
          className={[
            "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            statusTone === "ok" && "bg-emerald-500/20 text-emerald-300",
            statusTone === "warn" && "bg-amber-500/20 text-amber-200",
            statusTone === "down" && "bg-rose-500/20 text-rose-300",
            statusTone === "pending" && "bg-zinc-500/20 text-zinc-300",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {statusLabel}
        </span>
      </div>
      <p className="mt-2 text-lg font-semibold tabular-nums text-zinc-100">
        {latencyMs}
        <span className="ml-0.5 text-sm font-medium text-zinc-400">ms</span>
      </p>
      <p className="mt-1 text-[11px] text-zinc-500">
        Last check {formatTimestampOrText(lastCheckIso)}
      </p>
    </div>,
    document.body,
  );
}
