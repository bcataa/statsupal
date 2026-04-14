/** Scopes for customer developer API keys (Bearer token). */

export const API_SCOPES = [
  "read:status",
  "read:incidents",
  "read:uptime",
  "write:services",
  "write:incidents",
  "write:maintenance",
  "write:webhooks",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

export function isValidScope(s: string): s is ApiScope {
  return (API_SCOPES as readonly string[]).includes(s);
}

export function normalizeScopes(scopes: unknown): ApiScope[] {
  if (!Array.isArray(scopes)) {
    return [];
  }
  const out: ApiScope[] = [];
  const seen = new Set<string>();
  for (const x of scopes) {
    if (typeof x !== "string") {
      continue;
    }
    const t = x.trim();
    if (isValidScope(t) && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

export function hasScope(granted: readonly string[], required: ApiScope): boolean {
  return granted.includes(required);
}
