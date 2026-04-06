import { AppShell } from "@/components/layout/app-shell";
import { CreateIncidentModal } from "@/components/incidents/create-incident-modal";
import { AddServiceModal } from "@/components/services/add-service-modal";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();

  if (!supabase) {
    redirect("/login?setup=1");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <AppShell>{children}</AppShell>
      <AddServiceModal />
      <CreateIncidentModal />
    </>
  );
}
