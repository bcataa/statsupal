import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between px-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 text-xs font-bold text-white">
              S
            </span>
            Statsupal
          </Link>
          <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            <Link href="/services" className="hover:text-white">
              Monitors
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
