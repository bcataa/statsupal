import { PublicStatusView } from "@/components/status/public-status-view";

type StatusPageProps = {
  params: Promise<{ project: string }> | { project: string };
};

export default async function PublicStatusPageRoute({ params }: StatusPageProps) {
  const resolved = await Promise.resolve(params);
  return <PublicStatusView projectParam={resolved.project} />;
}
