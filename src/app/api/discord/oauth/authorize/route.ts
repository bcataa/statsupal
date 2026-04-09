import { NextResponse } from "next/server";
import { logDiscord } from "@/lib/logging/server-log";
import {
  DISCORD_BOT_INVITE_PERMISSIONS,
  DISCORD_BOT_INVITE_SCOPE,
  getDiscordOAuthConfig,
} from "@/lib/discord/env";
import { signDiscordOAuthState } from "@/lib/discord/oauth-state";
import { ensureWorkspace } from "@/lib/supabase/app-data";
import { createClient } from "@/lib/supabase/server";

const STATE_TTL_MS = 10 * 60 * 1000;

export async function GET() {
  const oauth = getDiscordOAuthConfig();
  if (!oauth) {
    logDiscord.warn("oauth authorize rejected: server oauth not configured");
    return NextResponse.json(
      {
        success: false,
        message:
          "Discord OAuth is not configured. Set DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, and DISCORD_OAUTH_STATE_SECRET.",
      },
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
    const state = signDiscordOAuthState(
      {
        userId: user.id,
        workspaceId: workspace.id,
        exp: Date.now() + STATE_TTL_MS,
      },
      oauth.stateSecret,
    );

    const params = new URLSearchParams({
      client_id: oauth.clientId,
      response_type: "code",
      redirect_uri: oauth.redirectUri,
      scope: DISCORD_BOT_INVITE_SCOPE,
      permissions: DISCORD_BOT_INVITE_PERMISSIONS,
      state,
    });

    const url = `https://discord.com/oauth2/authorize?${params.toString()}`;
    return NextResponse.redirect(url);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Could not start Discord authorization.",
      },
      { status: 500 },
    );
  }
}
