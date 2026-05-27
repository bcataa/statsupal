"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppData } from "@/state/app-data-provider";

type UserMenuProps = {
  variant?: "default" | "app";
};

function hue(email: string): number {
  return email.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
}

export function UserMenu({ variant = "default" }: UserMenuProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { workspace } = useAppData();
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setEmail(user?.email ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setEmail(s?.user?.email ?? null);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [supabase]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const logout = async () => {
    setIsLoggingOut(true);
    setOpen(false);
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const initials = email ? email.slice(0, 2).toUpperCase() : "SL";
  const bgHue = email ? hue(email) : 260;
  const isApp = variant === "app";

  const menuItems = [
    { label: "Overview",  href: "/overview", icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    )},
    { label: "Team",      href: "/team", icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    )},
    { label: "Settings",  href: "/settings", icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
    )},
  ] as const;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white/5"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ring-1 ring-white/15"
          style={{ background: `hsl(${bgHue},50%,38%)` }}
        >
          {initials}
        </span>
        {isApp && (
          <span className="hidden max-w-[7rem] truncate text-sm text-zinc-400 sm:block">
            {email ?? "Account"}
          </span>
        )}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          className={`shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f1e] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.04]">
          {/* User info */}
          <div className="border-b border-white/[0.06] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: `hsl(${bgHue},50%,38%)` }}
              >
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-100">{email ?? "Account"}</p>
                <p className="truncate text-xs text-zinc-500">{workspace.name}</p>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <div className="py-1.5">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                <span className="text-zinc-500">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-white/[0.06] py-1.5">
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={logout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-60"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-zinc-500">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              {isLoggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
