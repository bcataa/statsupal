import Link from "next/link";
import { AutomationsSettings } from "@/components/settings/automations-settings";
import { AiAssistantSettings } from "@/components/settings/ai-assistant-settings";

export default function AppsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Apps &amp; integrations</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Connect external tools, automate webhooks, and configure AI-assisted incident drafting.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/30 to-[#06070a] p-6 ring-1 ring-violet-500/10">
        <h2 className="text-sm font-semibold text-zinc-300">Where things live now</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-500">
          <li>Notifications (email &amp; Discord) — open your <span className="text-zinc-300">Status Page → Notifications</span> tab.</li>
          <li>Branding &amp; colors — <span className="text-zinc-300">Status Page → Customize</span>.</li>
          <li>Workspace name &amp; slug — <span className="text-zinc-300">Status Page → Settings</span>.</li>
        </ul>
        <p className="mt-4 text-sm text-zinc-500">
          Questions? <Link className="text-cyan-400 hover:underline" href="/contact">Contact us</Link>.
        </p>
      </div>

      <AutomationsSettings />
      <AiAssistantSettings />
    </div>
  );
}
