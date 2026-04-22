"use client";

import { useId } from "react";

export type TestRunState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string; ms?: number }
  | { status: "error"; message: string };

type MonitorTestInputProps = {
  url: string;
  onUrlChange: (value: string) => void;
  onRun: () => void;
  testState: TestRunState;
  inputRef?: React.RefObject<HTMLInputElement | null>;
};

function Spinner() {
  return (
    <span
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-100"
      aria-hidden
    />
  );
}

export function MonitorTestInput({ url, onUrlChange, onRun, testState, inputRef }: MonitorTestInputProps) {
  const id = useId();
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs text-zinc-500">
        URL to monitor
      </label>
      <div
        className={[
          "flex min-h-[52px] items-stretch overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a0a] transition-colors duration-200",
          "focus-within:border-white/15 focus-within:ring-1 focus-within:ring-white/10",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          id={id}
          type="url"
          name="url"
          autoComplete="url"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://your-service.com/health"
          className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
        />
        <div className="flex shrink-0 items-center border-l border-white/[0.08] bg-black/30 pr-1.5 pl-1">
          <button
            type="button"
            onClick={onRun}
            disabled={testState.status === "loading" || !url.trim()}
            className={[
              "inline-flex min-w-[3.5rem] items-center justify-center rounded-lg px-3 py-2 text-xs font-bold tracking-[0.12em] transition duration-200",
              "text-zinc-100",
              "hover:bg-white/5",
              "disabled:cursor-not-allowed disabled:opacity-35",
            ].join(" ")}
          >
            {testState.status === "loading" ? (
              <>
                <Spinner />
                <span className="ml-1.5">…</span>
              </>
            ) : (
              <span className="uppercase">Run</span>
            )}
          </button>
        </div>
      </div>

      {testState.status === "success" ? (
        <p className="flex flex-wrap items-center gap-2 text-xs text-emerald-400/95">
          <span aria-hidden>✓</span>
          <span>{testState.message}</span>
          {testState.ms != null ? <span className="tabular-nums text-emerald-300/80">{testState.ms} ms</span> : null}
        </p>
      ) : null}
      {testState.status === "error" ? (
        <p className="flex items-start gap-2 text-xs text-rose-400" role="alert">
          <span className="shrink-0" aria-hidden>
            ✕
          </span>
          <span>{testState.message}</span>
        </p>
      ) : null}
    </div>
  );
}
