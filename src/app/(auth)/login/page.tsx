"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/env";

function DarkInput({
  id, type = "text", value, onChange, placeholder, autoComplete,
}: {
  id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-0 transition focus:border-indigo-500/60 focus:bg-white/8 focus:ring-1 focus:ring-indigo-500/30"
    />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { isDevLocalFallback } = useMemo(() => getSupabaseEnv(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { router.replace("/services"); router.refresh(); }
    };
    checkSession();
  }, [router, supabase]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!supabase) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setIsSubmitting(true);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(), password,
    });
    if (signInError) { setError(signInError.message); setIsSubmitting(false); return; }
    if (!rememberMe) {
      await supabase.auth.signOut();
      setError("This prototype currently supports persistent sessions only.");
      setIsSubmitting(false);
      return;
    }
    if (signInData.user) router.push("/services");
    router.refresh();
  };

  return (
    <AuthPageShell>
      <div className="mx-auto w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1128]/80 shadow-[0_0_80px_-20px_rgba(99,102,241,0.5)] backdrop-blur-md">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

          <div className="px-8 py-8 sm:px-10 sm:py-10">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-zinc-400">Sign in to your Slebb account</p>

            {isDevLocalFallback && (
              <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-300">
                <span className="font-semibold">Local dev:</span> using Supabase at{" "}
                <code>127.0.0.1:54321</code>. Run{" "}
                <code>npx supabase start</code> then add a user in Studio → Authentication.
              </div>
            )}
            {!supabase && !isDevLocalFallback && (
              <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
                Configure <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable sign-in.
              </div>
            )}

            <form className="mt-7 space-y-4" onSubmit={onSubmit}>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Email
                </label>
                <DarkInput id="email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" autoComplete="email" />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-medium text-zinc-400">Password</label>
                  <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300">Forgot password?</Link>
                </div>
                <DarkInput id="password" type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete="current-password" />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 accent-indigo-500"
                />
                Remember me
              </label>

              {error && (
                <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {error}
                </div>
              )}
              {message && (
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !supabase}
                className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-400 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-500">
              No account?{" "}
              <Link href="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthPageShell>
  );
}
