import { publicRateLimitExceeded } from "@/lib/rate-limit/public-rate-limit-response";

export async function GET(request: Request) {
  const limited = publicRateLimitExceeded(request, "health:get");
  if (limited) {
    return limited;
  }

  return Response.json({
    ok: true,
    service: "statsupal",
    uptimeSec: Math.round(process.uptime()),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  });
}
