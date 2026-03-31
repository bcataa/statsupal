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

    if (!supabase) {
      setError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your env.",
      );
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setIsSubmitting(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo:
        typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
    });

    if (resetError) {
      setError(resetError.message);
      setIsSubmitting(false);
      return;
    }

    setMessage("Password reset email sent. Please check your inbox.");
    setIsSubmitting(false);
  };

  return (
    <AuthPageShell>
      <section className="mx-auto w-full max-w-md rounded-md border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Reset password
        </h1>
        <p className="mt-1 text-lg text-zinc-700">
          Enter your account email and we&apos;ll send reset instructions.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-zinc-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 w-full rounded-sm border border-zinc-300 px-3 text-sm text-zinc-900 outline-none focus:border-violet-400"
              autoComplete="email"
            />
          </div>

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
            {isSubmitting ? "Please wait..." : "Send reset email"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-600">
          Back to{" "}
          <Link href="/login" className="font-medium text-zinc-700 hover:text-zinc-900">
            Login
          </Link>
        </p>
      </section>
    </AuthPageShell>
  );
}
