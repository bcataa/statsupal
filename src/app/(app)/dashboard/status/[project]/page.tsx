import Link from "next/link";
import { PublicStatusView } from "@/components/status/public-status-view";

type PageProps = {
  params: Promise<{ project: string }> | { project: string };
};

export default async function DashboardStatusPage({ params }: PageProps) {
  const { project } = await Promise.resolve(params);
  const slug = decodeURIComponent(project || "").trim();
  const publicUrl = slug
    ? `/status/${encodeURIComponent(slug)}`
    : "/status/main-status-page";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-950">
        <p>
          You&apos;re viewing your status page <span className="font-medium">inside the dashboard</span>{" "}
          (sidebar stays open). Visitors use the public link without signing in:{" "}
          <Link
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-violet-800 underline decoration-violet-400 underline-offset-2 hover:text-violet-900"
          >
            Open public page
          </Link>
          .
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-inner">
        <PublicStatusView projectParam={project} />
      </div>
    </div>
  );
}
