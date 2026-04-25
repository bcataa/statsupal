import type { ServiceStatus } from "@/lib/models/monitoring";

/**
 * Custom colors for non-operational states on the public status page.
 * `operational` uses `WorkspaceStatusPageDesign.operationalColor` (stored separately in DB).
 */
export type StatusPageExtraColors = {
  /** Monitors reporting degraded / slow. */
  degradedColor?: string;
  /** Shown for partial overall / mixed degradation. */
  partialOutageColor?: string;
  /** All-down or per-service `down` accent. */
  majorOutageColor?: string;
  /** Reserved for future maintenance mode styling. */
  maintenanceColor?: string;
  /** Monitors in `pending` (not checked yet). */
  notStartedColor?: string;
};

export const DEFAULT_STATUS_PAGE_EXTRA: Required<StatusPageExtraColors> = {
  degradedColor: "#ecc94b",
  partialOutageColor: "#ff8c00",
  majorOutageColor: "#8f485d",
  maintenanceColor: "#004968",
  notStartedColor: "#dfe0e1",
};

export type StatusPageExtraThemeV1 = StatusPageExtraColors & {
  /** Optional logo optimized for dark headers; falls back to `logoUrl`. */
  logoDarkUrl?: string;
};

const EXTRA_KEYS: (keyof StatusPageExtraThemeV1)[] = [
  "logoDarkUrl",
  "degradedColor",
  "partialOutageColor",
  "majorOutageColor",
  "maintenanceColor",
  "notStartedColor",
];

export function parseStatusPageExtraTheme(raw: unknown): StatusPageExtraThemeV1 {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const o = raw as Record<string, unknown>;
  const out: StatusPageExtraThemeV1 = {};
  for (const k of EXTRA_KEYS) {
    const v = o[k];
    if (typeof v === "string" && v.trim() !== "") {
      out[k] = v;
    }
  }
  return out;
}

export function mergeStatusExtraColors(
  extra: StatusPageExtraColors | undefined,
): Required<StatusPageExtraColors> {
  return { ...DEFAULT_STATUS_PAGE_EXTRA, ...extra };
}

type Overall = "all-operational" | "partial-outage" | "major-outage";

export function overallAccentColor(
  overall: Overall,
  _brandHex: string,
  operationalHex: string,
  extra: StatusPageExtraColors | undefined,
): { bg: string; icon: string } {
  const m = mergeStatusExtraColors(extra);
  if (overall === "all-operational") {
    return { bg: `${operationalHex}18`, icon: operationalHex };
  }
  if (overall === "partial-outage") {
    return { bg: `${m.partialOutageColor}20`, icon: m.partialOutageColor };
  }
  return { bg: `${m.majorOutageColor}20`, icon: m.majorOutageColor };
}

export function serviceStatusAccent(
  status: ServiceStatus,
  operationalHex: string,
  extra: StatusPageExtraColors | undefined,
): string {
  const m = mergeStatusExtraColors(extra);
  if (status === "operational") {
    return operationalHex;
  }
  if (status === "degraded") {
    return m.degradedColor;
  }
  if (status === "down") {
    return m.majorOutageColor;
  }
  return m.notStartedColor;
}

export function buildExtraThemeForPersist(theme: StatusPageExtraThemeV1 | undefined): string | null {
  if (!theme) {
    return null;
  }
  const o: Record<string, string> = {};
  for (const k of EXTRA_KEYS) {
    const v = theme[k];
    if (typeof v === "string" && v.trim() !== "") {
      o[k] = v;
    }
  }
  return Object.keys(o).length ? JSON.stringify(o) : null;
}
