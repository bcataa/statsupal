import { NextResponse } from "next/server";
import { ensureWorkspace } from "@/lib/supabase/app-data";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id || id.length > 64) {
    return jsonError("Invalid key id.", 400);
  }

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
    const now = new Date().toISOString();
    const res = await supabase
      .from("developer_api_keys")
      .update({ revoked_at: now })
      .eq("id", id)
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .select("id")
      .maybeSingle();

    if (res.error) {
      if ((res.error as { code?: string }).code === "42P01") {
        return jsonError("developer_api_keys table is missing. Apply latest supabase/schema.sql.", 500);
      }
      return jsonError("Could not revoke key.", 500);
    }

    if (!res.data) {
      return jsonError("API key not found or already revoked.", 404);
    }

    return NextResponse.json({ success: true, message: "API key revoked." });
  } catch {
    return jsonError("Could not revoke key.", 500);
  }
}
