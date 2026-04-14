import { NextResponse } from "next/server";
import { normalizeScopes } from "@/lib/developer-api/scopes";
import { generateDeveloperApiKey, hashApiKeySecret } from "@/lib/developer-api/hash-api-key";
import { ensureWorkspace } from "@/lib/supabase/app-data";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return jsonError("Supabase is not configured.", 500);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return jsonError("Unauthorized.", 401);
  }

  try {
    const workspace = await ensureWorkspace(supabase, user.id);
    const res = await supabase
      .from("developer_api_keys")
      .select("id,name,key_prefix,scopes,last_used_at,created_at")
      .eq("workspace_id", workspace.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });

    if (res.error) {
      if ((res.error as { code?: string }).code === "42P01") {
        return jsonError("developer_api_keys table is missing. Apply latest supabase/schema.sql.", 500);
      }
      return jsonError("Could not load API keys.", 500);
    }

    return NextResponse.json({ success: true, keys: res.data ?? [] });
  } catch {
    return jsonError("Could not load workspace.", 500);
  }
}

type PostBody = {
  name?: string;
  scopes?: string[];
};

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return jsonError("Supabase is not configured.", 500);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return jsonError("Unauthorized.", 401);
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const name = body.name?.trim();
  if (!name || name.length > 120) {
    return jsonError("A name (max 120 characters) is required.", 400);
  }

  const scopes = normalizeScopes(body.scopes);
  if (scopes.length === 0) {
    return jsonError("Select at least one scope.", 400);
  }

  try {
    const workspace = await ensureWorkspace(supabase, user.id);
    const { fullKey, keyPrefix } = generateDeveloperApiKey();
    const keyHash = hashApiKeySecret(fullKey);
    const id = `dak_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;

    const insert = await supabase.from("developer_api_keys").insert({
      id,
      workspace_id: workspace.id,
      user_id: user.id,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      scopes,
      created_at: new Date().toISOString(),
    });

    if (insert.error) {
      if ((insert.error as { code?: string }).code === "42P01") {
        return jsonError("developer_api_keys table is missing. Apply latest supabase/schema.sql.", 500);
      }
      return jsonError("Could not create API key.", 500);
    }

    return NextResponse.json({
      success: true,
      key: fullKey,
      record: {
        id,
        name,
        key_prefix: keyPrefix,
        scopes,
      },
      message: "Copy this key now. It will not be shown again.",
    });
  } catch {
    return jsonError("Could not create API key.", 500);
  }
}
