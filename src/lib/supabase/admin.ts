import { createClient } from "@supabase/supabase-js";

type MonitoringEnv = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

export function getMonitoringEnv(): MonitoringEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing: string[] = [];
  if (!url) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!anonKey) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  if (!serviceRoleKey) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required Supabase env vars for server monitoring: ${missing.join(", ")}.`,
    );
  }

  return {
    url: url as string,
    anonKey: anonKey as string,
    serviceRoleKey: serviceRoleKey as string,
  };
}

export function createAdminClient(): unknown {
  const { url, serviceRoleKey } = getMonitoringEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as unknown;
}
