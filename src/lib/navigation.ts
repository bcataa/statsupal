export type NavItem = {
  label: string;
  href: string;
};

export const navigationItems: NavItem[] = [
  { label: "Overview", href: "/dashboard" },
  { label: "Monitors", href: "/services" },
  { label: "Issues", href: "/incidents" },
  { label: "Page", href: "/dashboard/status" },
  { label: "Settings", href: "/settings" },
];

const titleMap: Record<string, string> = {
  "/dashboard": "Overview",
  "/services": "Monitors",
  "/incidents": "Issues",
  "/settings": "Settings",
};

export function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/dashboard/status")) {
    return "Page";
  }

  if (pathname.startsWith("/settings/status-design")) {
    return "Status design";
  }

  return titleMap[pathname] ?? "Dashboard";
}
