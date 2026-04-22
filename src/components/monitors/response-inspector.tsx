"use client";

import { useMemo, useState } from "react";

type Tab = "body" | "headers" | "query" | "screenshot";

type ResponseInspectorProps = {
  targetUrl: string;
  /** When we do not store bodies, show honest copy + sample block. */
  bodyPlaceholder: string;
};

export function ResponseInspector({ targetUrl, bodyPlaceholder }: ResponseInspectorProps) {
  const [tab, setTab] = useState<Tab>("body");

  const queryString = useMemo(() => {
    try {
      const u = new URL(targetUrl);
      return u.search ? u.search.replace(/^\?/, "") : "";
    } catch {
      return "";
    }
  }, [targetUrl]);

  const headersSample = useMemo(
    () =>
      [
        "content-type: text/html; charset=utf-8",
        "cache-control: no-cache",
        "x-request-id: (generated per check)",
      ].join("\n"),
    [],
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-[#080a0f]/90 p-4 ring-1 ring-violet-500/10">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
        <h3 className="text-sm font-semibold text-zinc-200">Response inspector</h3>
        <p className="text-[11px] text-zinc-500">Last check metadata (full capture is not stored)</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {(
          [
            ["body", "Body"],
            ["headers", "Headers"],
            ["query", "Query"],
            ["screenshot", "Shot"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={[
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              tab === id
                ? "bg-violet-600/25 text-violet-100 ring-1 ring-violet-500/40"
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 min-h-[12rem] rounded-xl border border-white/5 bg-black/40 p-3">
        {tab === "body" ? (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">{bodyPlaceholder}</p>
            <pre className="max-h-64 overflow-auto rounded-lg border border-white/5 bg-zinc-950/80 p-3 font-mono text-[11px] leading-relaxed text-cyan-100/90">
{`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Example</title>
  </head>
  <body>…</body>
</html>`}
            </pre>
          </div>
        ) : null}

        {tab === "headers" ? (
          <pre className="max-h-64 overflow-auto font-mono text-[11px] leading-relaxed text-violet-100/90">
            {headersSample}
          </pre>
        ) : null}

        {tab === "query" ? (
          <div>
            {queryString ? (
              <pre className="max-h-64 overflow-auto font-mono text-[11px] text-zinc-300">
                {queryString}
              </pre>
            ) : (
              <p className="text-sm text-zinc-500">No query string for this monitor URL.</p>
            )}
          </div>
        ) : null}

        {tab === "screenshot" ? (
          <div className="flex min-h-[10rem] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700/80 bg-zinc-900/30 p-6 text-center">
            <p className="text-sm text-zinc-400">Screenshot capture is not enabled yet.</p>
            <p className="mt-1 text-xs text-zinc-600">When available, a rendered preview will show here.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
