import { logDeveloperApi } from "@/lib/logging/server-log";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiScope } from "@/lib/developer-api/scopes";
import { hashApiKeySecret, looksLikeDeveloperApiKey } from "@/lib/developer-api/hash-api-key";

export type VerifiedApiKeyContext = {
  keyId: string;
  workspaceId: string;
  userId: string;
  scopes: ApiScope[];
};

export type ApiKeyAuthFailure = {
  code: "auth_required" | "invalid_api_key";
  message: string;
};

type KeyRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  scopes: string[] | null;
};

/**
 * Resolves Bearer token to workspace context using service role. Updates last_used_at (fire-and-forget).
 */
export async function authenticateDeveloperApiKey(
  request: Request,
): Promise<{ ok: true; ctx: VerifiedApiKeyContext } | { ok: false; failure: ApiKeyAuthFailure }> {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return {
      ok: false,
      failure: {
        code: "auth_required",
        message:
          "Include your API key in the request: add header Authorization: Bearer stu_live_… (create a key under Settings → Developer API).",
      },
    };
  }

  const token = auth.slice(7).trim();
  if (!token) {
    return {
      ok: false,
      failure: {
        code: "auth_required",
        message:
          "The Bearer token is empty. Use: Authorization: Bearer stu_live_your_key_here",
      },
    };
  }

  if (!looksLikeDeveloperApiKey(token)) {
    return {
      ok: false,
      failure: {
        code: "invalid_api_key",
        message:
          "That value is not a valid Statsupal API key format (keys start with stu_live_). Copy the full key from when it was created, or generate a new key in Settings.",
      },
    };
  }

  let hash: string;
  try {
    hash = hashApiKeySecret(token);
  } catch {
    return {
      ok: false,
      failure: {
        code: "invalid_api_key",
        message: "We could not read that API key. Generate a fresh key in Settings → Developer API.",
      },
    };
  }

  try {
    const admin = createAdminClient() as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (c: string, v: string) => {
            is: (c: string, v: null) => {
              maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
            };
          };
        };
        update: (row: Record<string, unknown>) => {
          eq: (c: string, v: string) => Promise<{ error: unknown }>;
        };
      };
    };

    const res = await admin
      .from("developer_api_keys")
      .select("id,workspace_id,user_id,scopes")
      .eq("key_hash", hash)
      .is("revoked_at", null)
      .maybeSingle();

    if (res.error || !res.data) {
      return {
        ok: false,
        failure: {
          code: "invalid_api_key",
          message:
            "This API key is not recognized. It may be mistyped, revoked, or from another project. Check Settings → Developer API or create a new key.",
        },
      };
    }

    const row = res.data as KeyRow;
    const scopes = (row.scopes ?? []).filter((s): s is ApiScope => typeof s === "string");

    void admin
      .from("developer_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", row.id)
      .then((u) => {
        if (u.error) {
          logDeveloperApi.warn("could not update API key last_used_at", { keyId: row.id });
        }
      })
      .catch(() => {});

    logDeveloperApi.info("API key authenticated", { keyId: row.id, workspaceId: row.workspace_id });

    return {
      ok: true,
      ctx: {
        keyId: row.id,
        workspaceId: row.workspace_id,
        userId: row.user_id,
        scopes,
      },
    };
  } catch (e) {
    logDeveloperApi.warn("API key verification failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    return {
      ok: false,
      failure: {
        code: "invalid_api_key",
        message:
          "We could not verify your API key right now. Try again in a moment, or create a new key in Settings.",
      },
    };
  }
}

export function unauthorizedDeveloperResponse(failure: ApiKeyAuthFailure) {
  return Response.json({ error: failure.message, code: failure.code }, { status: 401 });
}

export function forbiddenScopeResponse(requiredScope: ApiScope) {
  return Response.json(
    {
      error: `Your API key does not include the “${requiredScope}” permission. Open Settings → Developer API and create a key with that scope checked.`,
      code: "insufficient_scope",
      required_scope: requiredScope,
    },
    { status: 403 },
  );
}

export function rateLimitedDeveloperResponse(retryAfterSec: number) {
  return Response.json(
    {
      error:
        "Too many requests for this API key. Please slow down and try again in a little while.",
      code: "rate_limited",
      retry_after_seconds: retryAfterSec,
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}
