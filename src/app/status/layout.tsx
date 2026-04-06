import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Status | Statsupal",
  description: "Live service health, incidents, and maintenance updates.",
};

export default function StatusLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-zinc-100 text-zinc-900">{children}</div>;
}
