type StatusHeadProps = {
  params: { project: string };
};

export default function Head({ params }: StatusHeadProps) {
  const project = decodeURIComponent(params.project || "").trim() || "status";
  const titleName = project
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return (
    <>
      <title>{titleName} Status | Statsupal</title>
      <meta
        name="description"
        content="Live system status, incidents, and maintenance updates."
      />
      <meta property="og:title" content={`${titleName} Status | Statsupal`} />
      <meta
        property="og:description"
        content="Live system status, incidents, and maintenance updates."
      />
    </>
  );
}
