export type NavItem = {
  label: string;
  href: string;
};

export const navigationItems: NavItem[] = [
  { label: "Monitors", href: "/services" },
  { label: "Issues", href: "/incidents" },
  { label: "Page", href: "/dashboard/status" },
  { label: "Apps", href: "/apps" },
  { label: "Settings", href: "/settings" },
];

const titleMap: Record<string, string> = {
  "/services": "Monitors",
  "/incidents": "Issues",
  "/settings": "Settings",
  "/apps": "Apps",
};

export function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/dashboard/status")) {
    return "Page";
  }

  if (pathname.startsWith("/settings/status-design")) {
    return "Status design";
  }

  if (pathname.startsWith("/services/")) {
    return "Monitor";
  }

  if (pathname.startsWith("/apps")) {
    return "Apps";
  }

  return titleMap[pathname] ?? "Monitors";
}
