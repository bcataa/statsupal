"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loggedInStatusPageHref } from "@/lib/utils/status-slug";
import { useAppData } from "@/state/app-data-provider";

export default function DashboardStatusRedirectPage() {
  const router = useRouter();
  const { workspace, currentProject, isHydrated } = useAppData();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    router.replace(loggedInStatusPageHref(workspace, currentProject));
  }, [isHydrated, workspace, currentProject, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <p className="text-sm text-zinc-600">Opening your status page…</p>
    </div>
  );
}
