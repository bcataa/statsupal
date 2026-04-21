import { Suspense } from "react";
import { OnboardingWizard } from "./onboarding-wizard";

export default function OnboardingWizardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-black text-sm text-zinc-400">
          Loading…
        </div>
      }
    >
      <OnboardingWizard />
    </Suspense>
  );
}
