import { redirect } from "next/navigation";

export default function LegacyProfileOnboardingPage() {
  redirect("/onboarding/wizard");
}
