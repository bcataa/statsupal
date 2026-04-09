import { describe, expect, it } from "vitest";
import { signDiscordOAuthState, verifyDiscordOAuthState } from "@/lib/discord/oauth-state";

describe("Discord OAuth state", () => {
  const secret = "test-secret-key-for-hmac-only";

  it("round-trips valid payload", () => {
    const state = signDiscordOAuthState(
      {
        userId: "user-1",
        workspaceId: "ws-1",
        exp: Date.now() + 60_000,
      },
      secret,
    );
    const parsed = verifyDiscordOAuthState(state, secret);
    expect(parsed).toEqual(
      expect.objectContaining({
        userId: "user-1",
        workspaceId: "ws-1",
      }),
    );
  });

  it("rejects tampered state", () => {
    const state = signDiscordOAuthState(
      {
        userId: "user-1",
        workspaceId: "ws-1",
        exp: Date.now() + 60_000,
      },
      secret,
    );
    const tampered = `${state.slice(0, -4)}xxxx`;
    expect(verifyDiscordOAuthState(tampered, secret)).toBeNull();
  });

  it("rejects expired state", () => {
    const state = signDiscordOAuthState(
      {
        userId: "user-1",
        workspaceId: "ws-1",
        exp: Date.now() - 1000,
      },
      secret,
    );
    expect(verifyDiscordOAuthState(state, secret)).toBeNull();
  });

  it("rejects wrong secret", () => {
    const state = signDiscordOAuthState(
      {
        userId: "user-1",
        workspaceId: "ws-1",
        exp: Date.now() + 60_000,
      },
      secret,
    );
    expect(verifyDiscordOAuthState(state, "other-secret")).toBeNull();
  });
});
