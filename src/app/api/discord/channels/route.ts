import { NextResponse } from "next/server";
import { ensureWorkspace } from "@/lib/supabase/app-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type SecretRow = {
  discord_guild_id: string | null;
};

type DiscordChannel = {
  id: string;
  type: number;
  name: string | null;
  position?: number;
  parent_id?: string | null;
};

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Unknown error";
  }
  const value = error as { message?: unknown };
  return typeof value.message === "string" ? value.message : "Unknown error";
}

function hasErrorCode(error: unknown, code: string): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const value = error as { code?: unknown };
  return value.code === code;
}

/** Text and announcement channels suitable for bot messages. */
function isSelectableChannel(ch: DiscordChannel): boolean {
  return ch.type === 0 || ch.type === 5;
}

export async function GET() {
  const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!botToken) {
    return NextResponse.json(
      { success: false, message: "DISCORD_BOT_TOKEN is not configured on the server." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ success: false, message: "Supabase is not configured." }, { status: 500 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const workspace = await ensureWorkspace(supabase, user.id);
    const admin = createAdminClient() as {
      from: (table: string) => {
        select: (...args: unknown[]) => {
          eq: (...args: unknown[]) => {
            eq: (...args: unknown[]) => {
              maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
            };
          };
        };
      };
    };

    const secretResult = await admin
      .from("workspace_notification_secrets")
      .select("discord_guild_id")
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (secretResult.error) {
      if (hasErrorCode(secretResult.error, "42P01") || hasErrorCode(secretResult.error, "42703")) {
        return NextResponse.json(
          {
            success: false,
            message: "workspace_notification_secrets is missing columns. Apply latest schema.sql.",
          },
          { status: 500 },
        );
      }
      return NextResponse.json(
        { success: false, message: getErrorMessage(secretResult.error) },
        { status: 500 },
      );
    }

    const row = (secretResult.data ?? null) as SecretRow | null;
    const guildId = row?.discord_guild_id?.trim();
    if (!guildId) {
      return NextResponse.json(
        { success: false, message: "Connect Discord and add the bot to a server first." },
        { status: 400 },
      );
    }

    const discordRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!discordRes.ok) {
      const text = await discordRes.text();
      return NextResponse.json(
        {
          success: false,
          message:
            discordRes.status === 403
              ? "The bot cannot read channels in that server. Re-invite the bot or check permissions."
              : `Discord API error (${discordRes.status}). ${text.slice(0, 120)}`,
        },
        { status: 502 },
      );
    }

    const raw = (await discordRes.json()) as DiscordChannel[];
    const channels = raw
      .filter(isSelectableChannel)
      .map((ch) => ({
        id: ch.id,
        name: ch.name ?? "channel",
        position: ch.position ?? 0,
      }))
      .sort((a, b) => a.position - b.position);

    return NextResponse.json({ success: true, channels });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Could not load Discord channels.",
      },
      { status: 500 },
    );
  }
}
