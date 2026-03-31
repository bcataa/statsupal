"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type UserState = {
  email: string | null;
};

export function UserMenu() {
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

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-40 truncate text-sm text-zinc-500 sm:inline">
        {user.email ?? "User"}
      </span>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
        {initials}
      </div>
      <button
        type="button"
        onClick={logout}
        disabled={isLoggingOut}
        className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
      >
        {isLoggingOut ? "..." : "Logout"}
      </button>
    </div>
  );
}
