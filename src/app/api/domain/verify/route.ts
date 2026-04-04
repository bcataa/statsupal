export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VerifyBody = {
  domain?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyBody;
    const domain = body.domain?.trim().toLowerCase();
    if (!domain) {
      return Response.json({ success: false, message: "Domain is required." }, { status: 400 });
    }

    const dnsResponse = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=CNAME`,
      {
        cache: "no-store",
      },
    );
    if (!dnsResponse.ok) {
      return Response.json({ success: false, message: "Could not query DNS provider." }, { status: 502 });
    }
    const dnsPayload = (await dnsResponse.json()) as {
      Answer?: Array<{ data?: string }>;
    };
    const answers = dnsPayload.Answer ?? [];
    const verified = answers.length > 0;

    return Response.json({
      success: true,
      verified,
      dnsTarget: answers[0]?.data ?? null,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown verification failure.",
      },
      { status: 500 },
    );
  }
}
