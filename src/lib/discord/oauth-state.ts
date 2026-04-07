import { createHmac, timingSafeEqual } from "node:crypto";

export type DiscordOAuthStatePayload = {
  userId: string;
  workspaceId: string;
  exp: number;
};

export function signDiscordOAuthState(payload: DiscordOAuthStatePayload, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyDiscordOAuthState(
  state: string,
  secret: string,
): DiscordOAuthStatePayload | null {
  const dot = state.indexOf(".");
  if (dot <= 0) {
    return null;
  }
  const data = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(data).digest("base64url");
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }
  try {
    const json = Buffer.from(data, "base64url").toString("utf8");
    const payload = JSON.parse(json) as DiscordOAuthStatePayload;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) {
      return null;
    }
    if (typeof payload.userId !== "string" || typeof payload.workspaceId !== "string") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
