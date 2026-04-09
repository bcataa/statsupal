/** Exchange Discord OAuth authorization code (testable in isolation). */
export async function exchangeDiscordOAuthCode(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; status: number; bodySnippet: string }> {
  const fetchFn = params.fetchImpl ?? fetch;
  const tokenBody = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
  });

  const tokenRes = await fetchFn("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody.toString(),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text().catch(() => "");
    return {
      ok: false,
      status: tokenRes.status,
      bodySnippet: text.slice(0, 120),
    };
  }

  return { ok: true };
}
