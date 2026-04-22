import { Suspense } from "react";
import { StatusPageConsole } from "@/components/status/status-page-console";

type PageProps = {
  params: Promise<{ project: string }> | { project: string };
};

export default async function DashboardStatusPage({ params }: PageProps) {
  const { project } = await Promise.resolve(params);
  const slug = decodeURIComponent(project || "").trim();

  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-5xl py-20 text-center text-sm text-zinc-500">
          Loading status page console…
        </div>
      }
    >
      <StatusPageConsole projectParam={slug} />
    </Suspense>
  );
}
