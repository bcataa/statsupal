import { AddServiceButton } from "@/components/services/add-service-button";
import { CreateIncidentButton } from "@/components/incidents/create-incident-button";

type DashboardHeaderProps = {
  workspaceName: string;
  projectName: string;
  showCreateIncidentButton?: boolean;
};

export function DashboardHeader({
  workspaceName,
  projectName,
  showCreateIncidentButton = true,
}: DashboardHeaderProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {workspaceName}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            {projectName} Overview
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Track service health and incidents from one control center.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AddServiceButton />
          {showCreateIncidentButton ? (
            <CreateIncidentButton className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50" />
          ) : null}
        </div>
      </div>
    </section>
  );
}
