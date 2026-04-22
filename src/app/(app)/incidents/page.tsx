"use client";

import { Suspense } from "react";
import { IssuesConsole } from "@/components/issues/issues-console";

function IssuesFallback() {
  return (
    <div className="mx-auto w-full max-w-5xl animate-pulse px-1">
      <div className="rounded-[1.5rem] border border-white/10 bg-[#0a0a0a]/50 p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <div className="h-9 w-24 rounded-full bg-zinc-800/90" />
          <div className="h-9 w-28 rounded-full bg-zinc-800/60" />
          <div className="h-9 w-20 rounded-full bg-zinc-800/60" />
        </div>
        <div className="mt-4 ms-auto h-10 w-40 rounded-full bg-zinc-800/80" />
        <div className="mt-4 h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-500/30 to-cyan-500/20" />
        <div className="mt-6 h-48 rounded-xl bg-zinc-800/50" />
      </div>
    </div>
  );
}

export default function IncidentsPage() {
  return (
    <Suspense fallback={<IssuesFallback />}>
      <IssuesConsole />
    </Suspense>
  );
}
