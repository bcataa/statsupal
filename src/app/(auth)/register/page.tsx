"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

const benefits = [
  { icon: "⬡", color: "#818cf8", title: "Save hours on each incident", text: "Teams report saving 2+ hours per incident with clear automated workflows." },
  { icon: "◎", color: "#34d399", title: "Centralize system status", text: "Monitor services, publish uptime, and manage incidents in one place." },
  { icon: "◉", color: "#60a5fa", title: "Trusted by DevOps teams", text: "CTOs, SREs, and support engineers use Slebb to communicate clearly." },
];

export default function RegisterPage() {
  const supabase = useMemo(() => createClient(), []);
  const { isDevLocalFallback } = useMemo(() => getSupabaseEnv(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!supabase) { setError("Supabase is not configured."); return; }
    if (!email.trim() || !password.trim() || !passwordConfirmation.trim()) { setError("All fields are required."); return; }
    if (password !== passwordConfirmation) { setError("Passwords do not match."); return; }
    if (!acceptTerms) { setError("You must accept the Terms of Service and Privacy Policy."); return; }
    setIsSubmitting(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/onboarding/wizard` : undefined,
        data: { newsletter },
      },
    });
    if (signUpError) { setError(signUpError.message); setIsSubmitting(false); return; }
    setMessage("Account created. Check your email to confirm your account.");
    setIsSubmitting(false);
  };

  return (
    <AuthPageShell>
      <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        {/* Left — benefits */}
        <aside className="hidden lg:block">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Incident communication<br />that actually works
          </h2>
          <p className="mt-3 text-base leading-7 text-zinc-400">
            Join DevOps teams and CTOs who use Slebb to keep users informed during outages — automatically.
          </p>
          <div className="mt-8 space-y-6">
            {benefits.map((b) => (
              <div key={b.title} className="flex items-start gap-4">
                <span className="mt-0.5 text-xl" style={{ color: b.color }}>{b.icon}</span>
                <div>
                  <p className="text-sm font-bold text-zinc-100">{b.title}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">{b.text}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right — form */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1128]/80 shadow-[0_0_80px_-20px_rgba(99,102,241,0.5)] backdrop-blur-md">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
          <div className="px-8 py-8 sm:px-10 sm:py-10">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Create your Slebb account
            </h1>
            <p className="mt-1.5 text-sm text-zinc-400">Monitoring and status pages in one place</p>

            {isDevLocalFallback && (
              <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-300">
                <span className="font-semibold">Local dev:</span> run <code>npx supabase start</code> first.
              </div>
            )}
            {!supabase && !isDevLocalFallback && (
              <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
                Configure Supabase keys to enable registration.
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-zinc-400">Work email</label>
                <DarkInput id="email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" autoComplete="email" />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-zinc-400">Password</label>
                <DarkInput id="password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" autoComplete="new-password" />
              </div>
              <div>
                <label htmlFor="password-confirmation" className="mb-1.5 block text-xs font-medium text-zinc-400">Confirm password</label>
                <DarkInput id="password-confirmation" type="password" value={passwordConfirmation} onChange={setPasswordConfirmation} placeholder="••••••••" autoComplete="new-password" />
              </div>

              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-zinc-400">
                <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-indigo-500" />
                <span>
                  I accept the{" "}
                  <Link href="/terms" className="text-indigo-400 underline-offset-2 hover:text-indigo-300 hover:underline">Terms of Service</Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-indigo-400 underline-offset-2 hover:text-indigo-300 hover:underline">Privacy Policy</Link>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-zinc-500">
                <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-indigo-500" />
                Send me product updates &amp; tips
              </label>

              {error && (
                <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
              )}
              {message && (
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !supabase}
                className="mt-1 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-400 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating account…" : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </AuthPageShell>
  );
}
