import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_POINTS = 500;

type HistoryPoint = {
  status: string;
  response_time_ms: number;
  checked_at: string;
};

export async function GET(
  _req: Request,
  context: { params: Promise<{ serviceId: string }> },
) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { serviceId } = await context.params;
  if (!serviceId) {
    return NextResponse.json({ error: "Missing serviceId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("service_check_history")
    .select("status, response_time_ms, checked_at")
    .eq("service_id", serviceId)
    .eq("user_id", user.id)
    .order("checked_at", { ascending: false })
    .limit(MAX_POINTS);

  if (error) {
    console.error("[history] supabase", error);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }

  const points: HistoryPoint[] = (data ?? []).map((row) => ({
    status: String(row.status),
    response_time_ms: Number(row.response_time_ms ?? 0),
    checked_at: String(row.checked_at),
  }));

  // Oldest first for chart order
  points.reverse();

  return NextResponse.json({ points });
}
