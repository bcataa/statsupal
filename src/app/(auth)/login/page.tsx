"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        if (user.user_metadata?.onboarding_completed) {
          router.replace("/dashboard");
        } else {
          router.replace("/onboarding/profile");
        }
        router.refresh();
      }
    };

    checkSession();
  }, [router, supabase]);

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

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    if (!rememberMe) {
      await supabase.auth.signOut();
      setError("This prototype currently supports persistent sessions only.");
      setIsSubmitting(false);
      return;
    }

    if (signInData.user?.user_metadata?.onboarding_completed) {
      router.push("/dashboard");
    } else {
      router.push("/onboarding/profile");
    }
    router.refresh();
  };

  return (
    <AuthPageShell>
      <section className="mx-auto w-full max-w-md rounded-md border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-[42px] font-semibold tracking-tight text-zinc-900">Welcome back!</h1>
        <p className="mt-1 text-[22px] text-zinc-700">Sign in to your Statsupal account</p>

        {!supabase && (
          <p className="mt-5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Configure Supabase keys to access protected pages.
          </p>
        )}

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
              autoComplete="current-password"
            />
          </div>

          <label className="mt-1 inline-flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-300"
            />
            Remember Me?
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
            {isSubmitting ? "Please wait..." : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-600">
          <Link href="/register" className="font-medium text-zinc-700 hover:text-zinc-900">
            Sign up
          </Link>
          {"  ·  "}
          <Link href="/forgot-password" className="font-medium text-zinc-700 hover:text-zinc-900">
            Forgot my password
          </Link>
        </p>
      </section>
    </AuthPageShell>
  );
}
