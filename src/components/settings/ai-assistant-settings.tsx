"use client";

import Link from "next/link";

export function AiAssistantSettings() {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-zinc-900">AI assistant</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Optional OpenAI-powered help for incident text only. It never changes monitoring results,
        service status, or your infrastructure—only suggests summaries and drafts you can edit before
        publishing.
      </p>
      <div className="mt-4 space-y-2 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-sm text-violet-950">
        <p className="font-medium">Server-only configuration</p>
        <p className="text-xs leading-relaxed text-violet-900/90">
          Set these in your deployment environment (never in client code or the browser):
        </p>
        <ul className="list-inside list-disc text-xs text-violet-900/85">
          <li>
            <code className="rounded bg-white/80 px-1">STATSUPAL_AI_PROVIDER=openai</code> (or omit /
            use <code className="rounded bg-white/80 px-1">none</code> to disable)
          </li>
          <li>
            <code className="rounded bg-white/80 px-1">STATSUPAL_AI_API_KEY</code> — secret API key
          </li>
          <li>
            <code className="rounded bg-white/80 px-1">STATSUPAL_AI_MODEL</code> — e.g.{" "}
            <code className="rounded bg-white/80 px-1">gpt-4o-mini</code>
          </li>
          <li>
            Optional: <code className="rounded bg-white/80 px-1">STATSUPAL_AI_TEMPERATURE</code> (0–1),{" "}
            <code className="rounded bg-white/80 px-1">STATSUPAL_AI_MAX_OUTPUT_TOKENS</code>
          </li>
        </ul>
        <p className="text-xs text-violet-800/90">
          On the Incidents page, use <strong>Generate summary</strong> and{" "}
          <strong>Draft status update</strong> on a card when AI is configured.
        </p>
        <p className="mt-2 text-xs">
          <Link
            href="/developer-docs#ai-assistant"
            className="font-semibold text-violet-900 underline-offset-2 hover:underline"
          >
            {"How AI works & example requests →"}
          </Link>
        </p>
      </div>
    </section>
  );
}
