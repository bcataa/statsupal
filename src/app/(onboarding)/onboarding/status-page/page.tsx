"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppData } from "@/state/app-data-provider";
import { toSlug } from "@/lib/utils/slug";

export default function OnboardingStatusPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { updateWorkspaceInfo, setOnboardingState } = useAppData();
  const [pageName, setPageName] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    if (!pageName.trim() || !website.trim()) {
      setError("Please fill in the status page name and website.");
      return;
    }

    setIsSubmitting(true);

    const slug = toSlug(pageName.trim()) || "status-page";

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        status_page_name: pageName.trim(),
        status_page_slug: slug,
        status_page_website: website.trim(),
        onboarding_completed: true,
      },
    });

    if (updateError) {
      setError(updateError.message);
      setIsSubmitting(false);
      return;
    }

    updateWorkspaceInfo({ projectName: pageName.trim(), projectSlug: slug });
    setOnboardingState({ statusPageCreated: true });

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="px-4 py-8">
      <div className="mx-auto w-full max-w-[760px]">
        <div className="mb-8 rounded-sm border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          <p>One last step: configure your public status page identity.</p>
        </div>

        <h1 className="mb-4 text-center text-3xl font-semibold text-zinc-900">
          New status page
        </h1>

        <section className="mx-auto w-full max-w-[560px] rounded-sm border border-zinc-200 bg-white p-4 shadow-[0_8px_20px_-15px_rgba(0,0,0,0.55)]">
          <form className="space-y-3" onSubmit={onCreate}>
            <div>
              <label htmlFor="status-name" className="mb-1 block text-sm text-zinc-700">
                Company, project or service name
              </label>
              <input
                id="status-name"
                value={pageName}
                onChange={(event) => setPageName(event.target.value)}
                className="h-10 w-full rounded-sm border border-zinc-300 px-3 text-sm outline-none focus:border-violet-400"
                placeholder="Slebb"
              />
            </div>

            <div>
              <label htmlFor="website" className="mb-1 block text-sm text-zinc-700">
                Website
              </label>
              <div className="flex h-10 w-full items-center rounded-sm border border-zinc-300 bg-white px-3">
                <span className="text-sm text-zinc-500">https://</span>
                <input
                  id="website"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  className="ml-2 w-full text-sm outline-none"
                  placeholder="slebb.com"
                />
              </div>
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
              {isSubmitting ? "Please wait..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/onboarding/profile")}
              className="inline-flex h-8 w-full items-center justify-center rounded-full bg-zinc-100 text-sm text-zinc-700 hover:bg-zinc-200"
            >
              Cancel
            </button>
          </form>
        </section>

        <div className="mx-auto mt-9 w-full max-w-[560px]">
          <p className="text-center text-sm text-zinc-500">Or</p>
          <div className="mt-5 space-y-4">
            <article className="flex items-center justify-between rounded-sm border border-zinc-200 bg-white px-4 py-4 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  Import your status page from Atlassian Statuspage
                </p>
                <p className="text-sm text-zinc-500">
                  Use our importer tool to import components, incident history, and
                  subscriptions in just a few clicks.
                </p>
              </div>
              <span className="text-2xl text-zinc-500">→</span>
            </article>
            <article className="flex items-center justify-between rounded-sm border border-zinc-200 bg-white px-4 py-4 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  Import your status page from Status.io status page
                </p>
                <p className="text-sm text-zinc-500">
                  Use our importer tool to import components and subscriptions in just
                  a few clicks.
                </p>
              </div>
              <span className="text-2xl text-zinc-500">→</span>
            </article>
          </div>
        </div>
      </div>
    </main>
  );
}
