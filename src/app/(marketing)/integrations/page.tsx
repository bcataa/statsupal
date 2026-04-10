import Link from "next/link";

const integrations = [
  { name: "Slack", detail: "Send incident updates to on-call and stakeholder channels." },
  { name: "Discord", detail: "Broadcast service health and outage notifications instantly." },
  { name: "Webhook", detail: "Trigger external automations on status and incident changes." },
  { name: "Email", detail: "Notify subscribers with structured incident communication." },
  { name: "API", detail: "Programmatically manage services, incidents, and status pages." },
  { name: "Status Imports", detail: "Import data from existing status platforms in minutes." },
];

export default function IntegrationsPage() {
  return (
    <main className="px-5 py-10 text-zinc-900 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
            Integrations
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Connect status workflows with your stack
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            Plug incident communication into the tools your team already uses for
            operations, alerting, and customer messaging.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex h-11 items-center rounded-full bg-[#5f58f7] px-6 text-sm font-medium text-white hover:bg-[#544df1]"
            >
              Get started
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-full border border-zinc-300 bg-white px-6 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Back home
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <article
              key={integration.name}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-zinc-900">{integration.name}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{integration.detail}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
