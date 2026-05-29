import { redirect } from "next/navigation";

/**
 * Legacy Settings page removed. Workspace settings live in the Status Page console
 * (Settings / Notifications / Customize tabs); integrations live in /apps.
 */
export default function SettingsPage() {
  redirect("/apps");
}
