import { redirect } from "next/navigation";

/** Legacy “Overview” URL; main home is Monitors at `/services`. */
export default function DashboardPage() {
  redirect("/services");
}
