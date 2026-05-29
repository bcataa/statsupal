import { redirect } from "next/navigation";

/** @deprecated — developer/API tooling now lives under Apps & integrations. */
export default function DeveloperDocsRedirectPage() {
  redirect("/apps");
}
