import Link from "next/link";

type AuthPageShellProps = {
  children: React.ReactNode;
};

export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f5f8] px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.25)_0,rgba(148,163,184,0.08)_40%,transparent_75%)] lg:block" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center justify-center gap-3 text-zinc-800">
          <Link href="/" className="flex items-center gap-1.5 text-base font-semibold">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-violet-300 text-[10px] text-violet-700">
              S
            </span>
            Statuspal
          </Link>
          <button
            type="button"
            className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs text-zinc-600"
          >
            EU
          </button>
        </div>

        {children}
      </div>
    </main>
  );
}
