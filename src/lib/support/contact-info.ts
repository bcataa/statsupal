/** Public support email for marketing, legal, and in-app copy. Set NEXT_PUBLIC_SUPPORT_EMAIL in production. */
export function getPublicSupportEmail(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  if (fromEnv && fromEnv.includes("@")) {
    return fromEnv;
  }
  return "support@statsupal.com";
}

export function getPublicSupportMailto(): string {
  return `mailto:${getPublicSupportEmail()}`;
}
