export function isAllowedWebhookUrl(raw: string): { ok: true; url: string } | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, message: "Webhook URL is required." };
  }
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return { ok: false, message: "Webhook URL must be a valid http(s) URL." };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, message: "Only http and https URLs are allowed." };
  }
  return { ok: true, url: trimmed };
}
