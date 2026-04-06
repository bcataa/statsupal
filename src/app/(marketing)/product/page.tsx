import Link from "next/link";

const features = [
  {
    title: "Status Pages",
    description:
      "Publish customer-facing and private status pages with clean uptime and incident communication.",
  },
  {
    title: "Incident Management",
    description:
      "Create incidents manually or from monitoring signals, then move through a clear resolution workflow.",
  },
  {
    title: "Monitoring",
    description:
      "Track services with continuous HTTP checks and live health updates for every endpoint.",
  },
  {
    title: "Operational Dashboard",
    description:
      "See services, incidents, and performance summaries in one central operations console.",
  },
];

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f8] px-5 py-10 text-zinc-900 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
            Product
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Built for reliable incident communication
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            Statsupal gives your team a focused platform to monitor services, communicate
            outages clearly, and keep customers informed in real time.
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

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-zinc-900">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{feature.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
