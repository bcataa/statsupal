import { MarketingNavbar } from "@/components/marketing/marketing-navbar";

/**
 * Shared shell for all marketing routes: one persistent navbar + client-side navigation
 * between Product, How it works, Showcase, etc. Dashboard and auth use other layouts.
 */
export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#f5f5f8] text-zinc-900">
      <MarketingNavbar />
      {children}
    </div>
  );
}
