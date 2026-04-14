import { headers } from "next/headers";
import { DeveloperApiDocs } from "@/components/developer/developer-api-docs";

export default async function DeveloperDocsPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const forwardedProto = h.get("x-forwarded-proto");
  const proto =
    forwardedProto?.split(",")[0]?.trim() ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;

  return <DeveloperApiDocs baseUrl={baseUrl} />;
}
