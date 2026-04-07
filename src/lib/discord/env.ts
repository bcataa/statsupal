/** Permissions: View Channel + Send Messages */
export const DISCORD_BOT_INVITE_PERMISSIONS = "3072";

export function getDiscordOAuthConfig(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  stateSecret: string;
} | null {
  const clientId = process.env.DISCORD_CLIENT_ID?.trim();
  const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim();
  const redirectUri = process.env.DISCORD_REDIRECT_URI?.trim();
  const stateSecret = process.env.DISCORD_OAUTH_STATE_SECRET?.trim();
  if (!clientId || !clientSecret || !redirectUri || !stateSecret) {
    return null;
  }
  return { clientId, clientSecret, redirectUri, stateSecret };
}

export function settingsPathAfterDiscordOAuth(): string {
  const redirectUri = process.env.DISCORD_REDIRECT_URI?.trim();
  if (redirectUri) {
    try {
      return `${new URL(redirectUri).origin}/settings`;
    } catch {
      // fall through
    }
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    try {
      return `${new URL(appUrl).origin}/settings`;
    } catch {
      // fall through
    }
  }
  return "/settings";
}
