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

  if (user.user_metadata?.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#f4f4f6]">
      <header className="h-9 bg-[#5d49e3] text-white">
        <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between px-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/70 text-[9px]">
              S
            </span>
            Statsupal
          </Link>
          <span className="text-xs">◉</span>
        </div>
      </header>
      {children}
    </div>
  );
}
