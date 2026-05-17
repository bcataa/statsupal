"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!supabase) { setError("Supabase is not configured."); return; }
    if (!email.trim()) { setError("Email is required."); return; }
    setIsSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
    });
    if (resetError) { setError(resetError.message); setIsSubmitting(false); return; }
    setMessage("Password reset email sent. Please check your inbox.");
    setIsSubmitting(false);
  };

  return (
    <AuthPageShell>
      <div className="mx-auto w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1128]/80 shadow-[0_0_80px_-20px_rgba(99,102,241,0.5)] backdrop-blur-md">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

          <div className="px-8 py-8 sm:px-10 sm:py-10">
            <h1 className="text-3xl font-bold tracking-tight text-white">Reset password</h1>
            <p className="mt-1.5 text-sm text-zinc-400">
              Enter your email and we&apos;ll send reset instructions.
            </p>

            <form className="mt-7 space-y-4" onSubmit={onSubmit}>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-0 transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
              )}
              {message && (
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !supabase}
                className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-400 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Sending…" : "Send reset email"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-500">
              Back to{" "}
              <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </AuthPageShell>
  );
}
