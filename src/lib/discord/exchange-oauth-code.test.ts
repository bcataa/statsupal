import { describe, expect, it, vi } from "vitest";
import { exchangeDiscordOAuthCode } from "@/lib/discord/exchange-oauth-code";

describe("exchangeDiscordOAuthCode", () => {
  it("returns ok when Discord accepts the code", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    const result = await exchangeDiscordOAuthCode({
      clientId: "cid",
      clientSecret: "sec",
      code: "code",
      redirectUri: "https://app.example/callback",
      fetchImpl,
    });
    expect(result).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("returns status and body snippet on failure", async () => {
    const fetchImpl = vi.fn(
      async () => new Response("invalid_grant", { status: 400, statusText: "Bad Request" }),
    );
    const result = await exchangeDiscordOAuthCode({
      clientId: "cid",
      clientSecret: "sec",
      code: "bad",
      redirectUri: "https://app.example/callback",
      fetchImpl,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.bodySnippet).toContain("invalid_grant");
    }
  });
});
