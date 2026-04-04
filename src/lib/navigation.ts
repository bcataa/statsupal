export type NavItem = {
  label: string;
  href: string;
};

export const navigationItems: NavItem[] = [
  { label: "Overview", href: "/dashboard" },
  { label: "Services", href: "/services" },
  { label: "Incidents", href: "/incidents" },
  { label: "Status Page", href: "/status" },
  { label: "Settings", href: "/settings" },
];

const titleMap: Record<string, string> = {
  "/dashboard": "Overview",
  "/services": "Services",
  "/incidents": "Incidents",
  "/settings": "Settings",
};

export function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/status/")) {
    return "Public Status Page";
  }

  return titleMap[pathname] ?? "Dashboard";
}
