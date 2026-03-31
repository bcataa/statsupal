"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppData } from "@/state/app-data-provider";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { updateWorkspaceInfo, setOnboardingState } = useAppData();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onContinue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    if (!fullName.trim() || !companyName.trim()) {
      setError("Please fill in full name and company name.");
      return;
    }

    setIsSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
        company_name: companyName.trim(),
      },
    });

    if (updateError) {
      setError(updateError.message);
      setIsSubmitting(false);
      return;
    }

    updateWorkspaceInfo({ workspaceName: `${companyName.trim()} Workspace` });
    setOnboardingState({ profileCompleted: true });

    router.push("/onboarding/status-page");
    router.refresh();
  };

  return (
    <main className="px-4 py-8">
      <div className="mx-auto w-full max-w-[760px]">
        <div className="mb-8 flex items-center justify-between rounded-sm border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          <p>Account created successfully.</p>
          <button type="button" className="text-sky-600">
            ×
          </button>
        </div>

        <h1 className="mb-4 text-center text-3xl font-semibold text-zinc-900">
          Welcome on board StatusPal
        </h1>

        <section className="mx-auto w-full max-w-[560px] rounded-sm border border-zinc-200 bg-white p-4 shadow-[0_8px_20px_-15px_rgba(0,0,0,0.55)]">
          <form className="space-y-3" onSubmit={onContinue}>
            <div>
              <label htmlFor="full-name" className="mb-1 block text-sm text-zinc-700">
                What&apos;s your full name?
              </label>
              <input
                id="full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="h-10 w-full rounded-sm border border-zinc-300 px-3 text-sm outline-none focus:border-violet-400"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="company-name" className="mb-1 block text-sm text-zinc-700">
                Company name
              </label>
              <input
                id="company-name"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                className="h-10 w-full rounded-sm border border-zinc-300 px-3 text-sm outline-none focus:border-violet-400"
                placeholder="Apple"
              />
            </div>

            {error && (
              <p className="rounded-sm border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 w-full items-center justify-center rounded-full bg-[#5f58f7] text-sm font-medium text-white transition hover:bg-[#544df1] disabled:opacity-70"
            >
              {isSubmitting ? "Please wait..." : "Continue"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
