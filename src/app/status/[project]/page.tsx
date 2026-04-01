type StatusPageProps = {
  params: Promise<{ project: string }>;
};

export default async function StatusPage({ params }: StatusPageProps) {
  const { project } = await params;

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Status Page</h1>
      <p className="mt-3 text-zinc-600">Project: {project || "demo"}</p>
    </main>
  );
}
