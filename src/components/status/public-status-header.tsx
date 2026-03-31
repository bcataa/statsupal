type PublicStatusHeaderProps = {
  projectName: string;
  updatedText: string;
};

export function PublicStatusHeader({ projectName, updatedText }: PublicStatusHeaderProps) {
  return (
    <header className="space-y-3 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {projectName} Status
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
        {projectName} Status
      </h1>
      <p className="mx-auto max-w-2xl text-sm text-zinc-600 sm:text-base">
        Live service health and incident communications for customers and internal teams.
      </p>
      <p className="text-xs text-zinc-500">{updatedText}</p>
    </header>
  );
}
