"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/env";

const benefits = [
  {
    title: "Save hours on each incident",
    text: "Our customers report saving at least 2 hours on each incident.",
  },
  {
    title: "Centralize system status",
    text: "Monitor and publish historical SLA for your applications with ease.",
  },
  {
    title: "You'll be in good company",
    text: "Hundreds of DevOps/SRE, CTOs and operation teams communicate effectively.",
  },
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

    if (!supabase) {
      setError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your env.",
      );
      return;
    }

    if (!email.trim() || !password.trim() || !passwordConfirmation.trim()) {
      setError("All fields are required.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Password and password confirmation must match.");
      return;
    }

    if (!acceptTerms) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      return;
    }

    setIsSubmitting(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/onboarding/wizard`
            : undefined,
        data: {
          newsletter,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsSubmitting(false);
      return;
    }

    setMessage("Account created. Please check your email to confirm your account.");
    setIsSubmitting(false);
  };

  return (
    <AuthPageShell>
      <section className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="rounded-md border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-[40px] font-semibold tracking-tight text-zinc-900">
            Create your Statsupal account
          </h1>
          <p className="mt-1 text-[20px] text-zinc-700">Monitoring and status pages in one place</p>

          {isDevLocalFallback && (
            <p className="mt-5 rounded border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
              <span className="font-medium">Local dev:</span> run <code className="text-xs">npx supabase start</code>{" "}
              first, then sign up here (or create a user in Studio). Cloud keys in <code className="text-xs">.env</code>{" "}
              override this.
            </p>
          )}
          {!supabase && !isDevLocalFallback && (
            <p className="mt-5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Configure Supabase keys to enable registration, or use <code className="text-xs">next dev</code> with
              local Supabase.
            </p>
          )}

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-zinc-700">
                Work email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-10 w-full rounded-sm border border-zinc-300 px-3 text-sm text-zinc-900 outline-none focus:border-violet-400"
                autoComplete="email"
                placeholder="alex@acme.corp"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm text-zinc-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-10 w-full rounded-sm border border-zinc-300 px-3 text-sm text-zinc-900 outline-none focus:border-violet-400"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="password-confirmation" className="mb-1 block text-sm text-zinc-700">
                Password confirmation
              </label>
              <input
                id="password-confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                className="h-10 w-full rounded-sm border border-zinc-300 px-3 text-sm text-zinc-900 outline-none focus:border-violet-400"
                autoComplete="new-password"
              />
            </div>

            <label className="inline-flex items-start gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(event) => setAcceptTerms(event.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300"
              />
              <span>
                I accept the{" "}
                <Link href="/terms" className="underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <p className="text-xs text-zinc-500">
              We process the data you provide according to our Privacy Policy.
            </p>

            <label className="inline-flex items-start gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(event) => setNewsletter(event.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300"
              />
              <span>Send me newsletters &amp; occasional offers</span>
            </label>

            {error && (
              <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}

            {message && (
              <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !supabase}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#5f58f7] px-4 text-base font-medium text-white transition hover:bg-[#544df1] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Please wait..." : "Create account"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-zinc-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-zinc-700 hover:text-zinc-900">
              Login here
            </Link>
          </p>
        </div>

        <aside className="hidden lg:block">
          <h2 className="text-4xl font-semibold tracking-tight text-zinc-900">
            Effective incident communication starts here
          </h2>

          <div className="mt-6 space-y-6">
            {benefits.map((item) => (
              <article key={item.title}>
                <p className="flex items-center gap-2 text-2xl font-semibold text-zinc-900">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-400 text-xs">
                    ✓
                  </span>
                  {item.title}
                </p>
                <p className="mt-1 pl-7 text-lg leading-7 text-zinc-700">{item.text}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </AuthPageShell>
  );
}
