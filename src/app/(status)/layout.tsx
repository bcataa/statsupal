export default function PublicStatusLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-zinc-100">{children}</div>;
}
