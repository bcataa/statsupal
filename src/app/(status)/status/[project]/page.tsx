import { PublicStatusPage } from "@/components/status/public-status-page";

type StatusPageProps = {
  params: Promise<{ project: string }>;
};

export default async function StatusPage({ params }: StatusPageProps) {
  const { project } = await params;
  return <PublicStatusPage project={project || "demo"} />;
}
