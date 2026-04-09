import { NextResponse } from "next/server";
import { exchangeDiscordOAuthCode } from "@/lib/discord/exchange-oauth-code";
import { getDiscordOAuthConfig, settingsPathAfterDiscordOAuth } from "@/lib/discord/env";
import { verifyDiscordOAuthState } from "@/lib/discord/oauth-state";
import { logDiscord } from "@/lib/logging/server-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function redirectSettings(query: string) {
  const base = settingsPathAfterDiscordOAuth();
  const sep = base.includes("?") ? "&" : "?";
  return NextResponse.redirect(`${base}${sep}${query}`);
}

type SecretRow = {
  discord_guild_id: string | null;
  discord_bot_channel_id: string | null;
};

export async function GET(request: Request) {
  const oauth = getDiscordOAuthConfig();
  const fail = (code: string) => redirectSettings(`discord=${encodeURIComponent(code)}`);

  if (!oauth) {
    return fail("oauth_not_configured");
  }

  const url = new URL(request.url);
  const err = url.searchParams.get("error");
  if (err === "access_denied") {
    return fail("denied");
  }
  if (err) {
    return fail("discord_error");
  }

  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const guildId = url.searchParams.get("guild_id")?.trim();

  if (!code || !stateRaw) {
    return fail("missing_params");
  }

  const statePayload = verifyDiscordOAuthState(stateRaw, oauth.stateSecret);
  if (!statePayload) {
    return fail("bad_state");
  }

  if (!guildId) {
    return fail("no_guild");
  }

  const supabase = await createClient();
  if (!supabase) {
    return fail("no_supabase");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user || user.id !== statePayload.userId) {
    return fail("session");
  }

  if (!process.env.DISCORD_BOT_TOKEN?.trim()) {
    return fail("no_bot_token");
  }

  const exchanged = await exchangeDiscordOAuthCode({
    clientId: oauth.clientId,
    clientSecret: oauth.clientSecret,
    code,
    redirectUri: oauth.redirectUri,
  });

  if (!exchanged.ok) {
    logDiscord.error("oauth token exchange failed", {
      status: exchanged.status,
      bodySnippet: exchanged.bodySnippet,
    });
    return fail("token_exchange");
  }

  try {
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
      };
    };

    if (statePayload.workspaceId.length === 0) {
      return fail("bad_workspace");
    }

    const existingResult = await admin
      .from("workspace_notification_secrets")
      .select("discord_guild_id,discord_bot_channel_id")
      .eq("workspace_id", statePayload.workspaceId)
      .eq("user_id", statePayload.userId)
      .maybeSingle();

    const existing = (existingResult.data ?? null) as SecretRow | null;
    const sameGuild = existing?.discord_guild_id?.trim() === guildId;
    const channelId = sameGuild ? existing?.discord_bot_channel_id?.trim() || null : null;

    const saveResult = await admin.from("workspace_notification_secrets").upsert(
      {
        workspace_id: statePayload.workspaceId,
        user_id: statePayload.userId,
        discord_bot_token: null,
        discord_guild_id: guildId,
        discord_bot_channel_id: channelId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id" },
    );

    if (saveResult.error) {
      const codeKnown =
        saveResult.error && typeof saveResult.error === "object" && "code" in saveResult.error
          ? (saveResult.error as { code?: string }).code
          : undefined;
      if (codeKnown === "42P01" || codeKnown === "42703") {
        return fail("schema");
      }
      return fail("save_failed");
    }

    return redirectSettings("discord=connected");
  } catch {
    return fail("save_failed");
  }
}
