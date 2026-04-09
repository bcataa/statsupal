import { logApi } from "@/lib/logging/server-log";
import { publicRateLimitExceeded } from "@/lib/rate-limit/public-rate-limit-response";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscribeBody = {
  projectSlug?: string;
  email?: string;
  incidentCreated?: boolean;
  incidentResolved?: boolean;
  maintenanceAlerts?: boolean;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function POST(request: Request) {
  const limited = publicRateLimitExceeded(request, "status:subscribe");
  if (limited) {
    return limited;
  }
  try {
    const body = (await request.json()) as SubscribeBody;
    const projectSlug = body.projectSlug?.trim();
    const email = body.email?.trim().toLowerCase();
    if (!projectSlug || !email || !isValidEmail(email)) {
      return Response.json(
        { success: false, message: "A valid project slug and email are required." },
        { status: 400 },
      );
    }

    const db = createAdminClient() as {
      from: (table: string) => {
        select: (...args: unknown[]) => {
          eq: (...args: unknown[]) => {
            maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
          };
        };
        upsert: (...args: unknown[]) => Promise<{ error: unknown }>;
      };
    };

    const workspaceResult = await db
      .from("workspaces")
      .select("id")
      .eq("project_slug", projectSlug)
      .maybeSingle();
    if (workspaceResult.error || !workspaceResult.data) {
      return Response.json(
        { success: false, message: "Status page not found for this project." },
        { status: 404 },
      );
    }
    const workspace = workspaceResult.data as { id: string };

    const upsertResult = await db.from("alert_subscribers").upsert(
      {
        id: `sub_${crypto.randomUUID().split("-")[0]}`,
        workspace_id: workspace.id,
        email,
        incident_created: body.incidentCreated ?? true,
        incident_resolved: body.incidentResolved ?? true,
        maintenance_alerts: body.maintenanceAlerts ?? true,
        token: createToken(),
        active: true,
        created_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,email" },
    );

    if (upsertResult.error) {
      return Response.json(
        { success: false, message: "Could not save subscription." },
        { status: 500 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    logApi.error("status subscribe failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown subscription error.",
      },
      { status: 500 },
    );
  }
}
