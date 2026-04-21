"use client";

import Link from "next/link";
import { useAppData } from "@/state/app-data-provider";

type OnboardingChecklistCardProps = {
  servicesCount: number;
  incidentsCount: number;
};

type ChecklistItem = {
  id: string;
  label: string;
  completed: boolean;
};

export function OnboardingChecklistCard({
  servicesCount,
  incidentsCount,
}: OnboardingChecklistCardProps) {
  const { onboarding, setOnboardingState, workspace } = useAppData();
  const wizardStep = workspace.statusPage.onboardingWizardStep;
  const wizardDone = wizardStep >= 6;

  const items: ChecklistItem[] = [
    {
      id: "wizard",
      label: "Guided setup (monitor, page, design)",
      completed: wizardDone,
    },
    {
      id: "first-service",
      label: "At least one monitor",
      completed: servicesCount > 0,
    },
    {
      id: "status-page",
      label: "Status page slug configured",
      completed: Boolean(workspace.projects[0]?.slug),
    },
    {
      id: "first-incident",
      label: "Practice with an incident (optional)",
      completed: incidentsCount > 0,
    },
    {
      id: "alerts",
      label: "Configure alerts",
      completed: onboarding.alertsConfigured,
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Setup checklist</h2>
          <p className="text-sm text-zinc-500">
            Finish the guided flow for a polished public page, or work from here at your own pace.
          </p>
        </div>
        <p className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
          {completedCount}/{items.length}
        </p>
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-violet-500 transition-all"
          style={{ width: `${(completedCount / items.length) * 100}%` }}
        />
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2"
          >
            <span className={item.completed ? "text-zinc-800" : "text-zinc-600"}>
              {item.label}
            </span>
            <span
              className={[
                "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold",
                item.completed
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-zinc-100 text-zinc-500",
              ].join(" ")}
            >
              {item.completed ? "✓" : "•"}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        {!wizardDone ? (
          <Link
            href="/onboarding/wizard"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Continue guided setup
          </Link>
        ) : null}
        {!onboarding.alertsConfigured ? (
          <button
            type="button"
            onClick={() => setOnboardingState({ alertsConfigured: true })}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Mark alerts as configured
          </button>
        ) : null}
      </div>
    </section>
  );
}
