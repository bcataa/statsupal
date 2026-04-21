import { redirect } from "next/navigation";

export default function LegacyStatusPageOnboardingPage() {
  redirect("/onboarding/wizard");
}
