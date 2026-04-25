/**
 * When `npx supabase start` is running, the API is always here with this anon key
 * (Supabase CLI local defaults — not a production secret).
 * @see https://supabase.com/docs/guides/local-development
 */
const LOCAL_DEV_SUPABASE_URL = "http://127.0.0.1:54321";
const LOCAL_DEV_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export type SupabaseEnv = {
  url: string | undefined;
  anonKey: string | undefined;
  isConfigured: boolean;
  /** True when we fell back to local CLI defaults (dev only, no .env). */
  isDevLocalFallback: boolean;
};

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) {
    return { url, anonKey, isConfigured: true, isDevLocalFallback: false };
  }

  const disableLocal =
    process.env.NEXT_PUBLIC_STATSUPAL_DISABLE_DEV_LOCAL === "1" ||
    process.env.STATSUPAL_DISABLE_DEV_LOCAL === "1";

  if (process.env.NODE_ENV === "development" && !disableLocal) {
    return {
      url: LOCAL_DEV_SUPABASE_URL,
      anonKey: LOCAL_DEV_SUPABASE_ANON_KEY,
      isConfigured: true,
      isDevLocalFallback: true,
    };
  }

  return { url: url ?? undefined, anonKey: anonKey ?? undefined, isConfigured: false, isDevLocalFallback: false };
}
