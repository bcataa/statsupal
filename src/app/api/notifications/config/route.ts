import { NextResponse } from "next/server";
import { buildDiscordBotInviteUrl, getDiscordOAuthConfig } from "@/lib/discord/env";
import { ensureWorkspace } from "@/lib/supabase/app-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type SecretRow = {
  discord_bot_token: string | null;
  discord_bot_channel_id: string | null;
  discord_guild_id: string | null;
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

export async function GET() {
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
      .select("discord_bot_token,discord_bot_channel_id,discord_guild_id")
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (secretResult.error) {
      if (hasErrorCode(secretResult.error, "42P01")) {
        return NextResponse.json({
          success: false,
          message: "workspace_notification_secrets table is missing. Apply latest schema.sql.",
        });
      }
      if (hasErrorCode(secretResult.error, "42703")) {
        return NextResponse.json({
          success: false,
          message: "workspace_notification_secrets is missing discord_guild_id. Apply latest schema.sql.",
        });
      }
      return NextResponse.json(
        { success: false, message: getErrorMessage(secretResult.error) },
        { status: 500 },
      );
    }

    const row = (secretResult.data ?? null) as SecretRow | null;
    const channelId = row?.discord_bot_channel_id?.trim() || "";
    const guildId = row?.discord_guild_id?.trim() || "";
    const tokenExists = Boolean(
      process.env.DISCORD_BOT_TOKEN?.trim() || row?.discord_bot_token?.trim(),
    );
    const configured = tokenExists && channelId.length > 0;
    const discordClientId = process.env.DISCORD_CLIENT_ID?.trim();
    const oauthReady = Boolean(getDiscordOAuthConfig());
    const inviteUrl = discordClientId ? buildDiscordBotInviteUrl(discordClientId) : null;

    return NextResponse.json({
      success: true,
      discordBotConfigured: configured,
      discordBotChannelId: channelId || undefined,
      discordGuildId: guildId || undefined,
      discordOauthAuthorizeUrl: oauthReady ? "/api/discord/oauth/authorize" : null,
      inviteUrl: oauthReady ? null : inviteUrl,
      usesManagedBotToken: Boolean(process.env.DISCORD_BOT_TOKEN?.trim()),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Could not load Discord bot config.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

  let body: { discordBotChannelId?: string; clearDiscord?: boolean } = {};
  try {
    body = (await request.json()) as { discordBotChannelId?: string; clearDiscord?: boolean };
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  if (body.clearDiscord === true) {
    try {
      const workspace = await ensureWorkspace(supabase, user.id);
      const admin = createAdminClient() as {
        from: (table: string) => {
          delete: () => {
            eq: (...args: unknown[]) => {
              eq: (...args: unknown[]) => Promise<{ error: unknown }>;
            };
          };
        };
      };

      const removeResult = await admin
        .from("workspace_notification_secrets")
        .delete()
        .eq("workspace_id", workspace.id)
        .eq("user_id", user.id);
      if (removeResult.error && !hasErrorCode(removeResult.error, "42P01")) {
        throw new Error(getErrorMessage(removeResult.error));
      }
      return NextResponse.json({
        success: true,
        discordBotConfigured: false,
        discordGuildId: undefined,
        discordBotChannelId: undefined,
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: error instanceof Error ? error.message : "Could not disconnect Discord.",
        },
        { status: 500 },
      );
    }
  }

  const discordBotChannelId = (body.discordBotChannelId ?? "").trim();
  const hasChannel = discordBotChannelId.length > 0;

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
        upsert: (...args: unknown[]) => Promise<{ error: unknown }>;
        delete: () => {
          eq: (...args: unknown[]) => {
            eq: (...args: unknown[]) => Promise<{ error: unknown }>;
          };
        };
      };
    };

    const existingResult = await admin
      .from("workspace_notification_secrets")
      .select("discord_guild_id,discord_bot_channel_id")
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingResult.error && !hasErrorCode(existingResult.error, "42P01")) {
      if (hasErrorCode(existingResult.error, "42703")) {
        return NextResponse.json({
          success: false,
          message: "workspace_notification_secrets is missing discord_guild_id. Apply latest schema.sql.",
        });
      }
      throw new Error(getErrorMessage(existingResult.error));
    }

    const existing = (existingResult.data ?? null) as {
      discord_guild_id: string | null;
      discord_bot_channel_id: string | null;
    } | null;
    const guildId = existing?.discord_guild_id?.trim() || "";

    if (!hasChannel) {
      if (guildId.length > 0) {
        const clearChannelResult = await admin.from("workspace_notification_secrets").upsert(
          {
            workspace_id: workspace.id,
            user_id: user.id,
            discord_bot_token: null,
            discord_guild_id: guildId,
            discord_bot_channel_id: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "workspace_id" },
        );
        if (clearChannelResult.error) {
          if (hasErrorCode(clearChannelResult.error, "42P01")) {
            return NextResponse.json({
              success: false,
              message: "workspace_notification_secrets table is missing. Apply latest schema.sql.",
            });
          }
          throw new Error(getErrorMessage(clearChannelResult.error));
        }
        return NextResponse.json({
          success: true,
          discordBotConfigured: false,
          discordGuildId: guildId,
        });
      }

      const removeResult = await admin
        .from("workspace_notification_secrets")
        .delete()
        .eq("workspace_id", workspace.id)
        .eq("user_id", user.id);
      if (removeResult.error && !hasErrorCode(removeResult.error, "42P01")) {
        throw new Error(getErrorMessage(removeResult.error));
      }
      return NextResponse.json({
        success: true,
        discordBotConfigured: false,
      });
    }

    const saveResult = await admin.from("workspace_notification_secrets").upsert(
      {
        workspace_id: workspace.id,
        user_id: user.id,
        discord_bot_token: null,
        discord_guild_id: guildId.length > 0 ? guildId : null,
        discord_bot_channel_id: discordBotChannelId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id" },
    );

    if (saveResult.error) {
      if (hasErrorCode(saveResult.error, "42P01")) {
        return NextResponse.json({
          success: false,
          message: "workspace_notification_secrets table is missing. Apply latest schema.sql.",
        });
      }
      if (hasErrorCode(saveResult.error, "42703")) {
        return NextResponse.json({
          success: false,
          message: "workspace_notification_secrets is missing discord_guild_id. Apply latest schema.sql.",
        });
      }
      throw new Error(getErrorMessage(saveResult.error));
    }

    return NextResponse.json({
      success: true,
      discordBotConfigured: true,
      discordBotChannelId,
      discordGuildId: guildId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Could not save Discord bot config.",
      },
      { status: 500 },
    );
  }
}
