"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type UserState = {
  email: string | null;
};

type UserMenuProps = {
  /** Dark header styling (logged-in app shell). */
  variant?: "default" | "app";
};

export function UserMenu({ variant = "default" }: UserMenuProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<UserState>({ email: null });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    const loadUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      setUser({ email: authUser?.email ?? null });
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser({ email: session?.user?.email ?? null });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const initials = useMemo(() => {
    if (!user.email) {
      return "US";
    }

    return user.email.slice(0, 2).toUpperCase();
  }, [user.email]);

  const logout = async () => {
    if (!supabase) {
      router.push("/login?setup=1");
      return;
    }

    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
    setIsLoggingOut(false);
  };

  const isApp = variant === "app";
  return (
    <div className="flex items-center gap-2">
      <span
        className={[
          "hidden max-w-40 truncate text-sm sm:inline",
          isApp ? "text-zinc-500" : "text-zinc-500",
        ].join(" ")}
      >
        {user.email ?? "User"}
      </span>
      <div
        className={[
          "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ring-1",
          isApp
            ? "bg-gradient-to-br from-violet-600 to-cyan-600 ring-white/20"
            : "bg-zinc-900 ring-transparent",
        ].join(" ")}
      >
        {initials}
      </div>
      <button
        type="button"
        onClick={logout}
        disabled={isLoggingOut}
        className={[
          "rounded-lg px-2.5 py-1.5 text-xs font-medium disabled:opacity-60",
          isApp
            ? "border border-white/10 text-zinc-300 hover:bg-white/5"
            : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50",
        ].join(" ")}
      >
        {isLoggingOut ? "…" : "Logout"}
      </button>
    </div>
  );
}
