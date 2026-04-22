import Link from "next/link";

export default function AppsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Apps & integrations</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Connect external tools to Statsupal. Webhooks, chat notifications, and automation live here as
          you grow.
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/30 to-[#06070a] p-6 ring-1 ring-violet-500/10">
        <h2 className="text-sm font-semibold text-zinc-300">What you can do next</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-500">
          <li>Enable email under Settings → notifications.</li>
          <li>Embed your public status page or share the link from the Page tab.</li>
          <li>Use the same premium layout across incidents and status updates.</li>
        </ul>
        <p className="mt-4 text-sm text-zinc-500">
          Need something specific? See{" "}
          <Link className="text-cyan-400 hover:underline" href="/settings">
            Settings
          </Link>{" "}
          and{" "}
          <Link className="text-cyan-400 hover:underline" href="/contact">
            contact
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
