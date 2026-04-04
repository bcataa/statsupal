import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UnsubscribeBody = {
  token?: string;
};

export async function POST(request: Request) {
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
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown unsubscribe error.",
      },
      { status: 500 },
    );
  }
}
