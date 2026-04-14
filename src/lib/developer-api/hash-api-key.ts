import { createHash, randomBytes } from "node:crypto";

const KEY_PREFIX = "stu_live_";

/** Full secret shown once to the customer; never log or persist raw. */
export function generateDeveloperApiKey(): { fullKey: string; keyPrefix: string } {
  const suffix = randomBytes(24).toString("base64url");
  const fullKey = `${KEY_PREFIX}${suffix}`;
  const keyPrefix = `${fullKey.slice(0, 16)}…`;
  return { fullKey, keyPrefix };
}

export function hashApiKeySecret(fullKey: string): string {
  return createHash("sha256").update(fullKey, "utf8").digest("hex");
}

export function looksLikeDeveloperApiKey(token: string): boolean {
  return token.startsWith(KEY_PREFIX) && token.length > KEY_PREFIX.length + 8;
}
