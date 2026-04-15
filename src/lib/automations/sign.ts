import { createHmac, timingSafeEqual } from "node:crypto";

export function signAutomationBody(secret: string, rawBody: string): string {
  const h = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return h;
}

export function verifyAutomationSignature(secret: string, rawBody: string, signatureHex: string): boolean {
  try {
    const expected = signAutomationBody(secret, rawBody);
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signatureHex.trim(), "utf8");
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
