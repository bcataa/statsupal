import { logApi } from "@/lib/logging/server-log";
import { publicRateLimitExceeded } from "@/lib/rate-limit/public-rate-limit-response";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UnsubscribeBody = {
  token?: string;
};

export async function POST(request: Request) {
  const limited = publicRateLimitExceeded(request, "status:unsubscribe");
  if (limited) {
    return limited;
  }
  try {
    const body = (await request.json()) as UnsubscribeBody;
    const token = body.token?.trim();
    if (!token) {
      return Response.json({ success: false, message: "Token is required." }, { status: 400 });
    }

    const db = createAdminClient() as {
      from: (table: string) => {
        update: (...args: unknown[]) => {
          eq: (...args: unknown[]) => Promise<{ error: unknown }>;
        };
      };
    };

    const result = await db.from("alert_subscribers").update({ active: false }).eq("token", token);
    if (result.error) {
      return Response.json({ success: false, message: "Could not unsubscribe." }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    logApi.error("status unsubscribe failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown unsubscribe error.",
      },
      { status: 500 },
    );
  }
}
