import { redirect } from "next/navigation";

/** @deprecated — technical docs were folded into in-app settings for a simpler product. */
export default function DeveloperDocsRedirectPage() {
  redirect("/settings");
}
