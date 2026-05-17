import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { ScrollAnimatedBackground } from "@/components/marketing/scroll-animated-background";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative isolate min-h-screen max-w-[100vw] overflow-x-hidden text-zinc-100">
      <ScrollAnimatedBackground />
      <MarketingNavbar />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
