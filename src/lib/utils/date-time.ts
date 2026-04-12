/**
 * Shared date/time display for dashboard, incidents, services, settings, and public status.
 * All formatted instants use UTC so the same ISO timestamp reads identically everywhere
 * (avoids local timezone differing between pages).
 */
export const APP_DISPLAY_TIMEZONE = "UTC";
const LOCALE = "en-US";

function parseToDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === "") {
    return null;
  }
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Primary datetime: "Jan 7, 2026, 14:32 UTC" style (24h, UTC). */
export function formatDateTime(iso: string | Date | null | undefined): string {
  const d = parseToDate(iso);
  if (!d) {
    return "—";
  }

  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: APP_DISPLAY_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).format(d);
}

/**
 * If the value parses as a date, format like formatDateTime; otherwise return the raw string
 * (e.g. "Unknown" or placeholder copy).
 */
export function formatTimestampOrText(value: string): string {
  const d = parseToDate(value);
  if (!d) {
    return value;
  }
  return formatDateTime(d);
}

/** Date only in UTC (no time). */
export function formatDateUtc(iso: string | Date | null | undefined): string {
  const d = parseToDate(iso);
  if (!d) {
    return "—";
  }
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: APP_DISPLAY_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/** Short weekday label in UTC (for charts / compact UI). */
export function formatWeekdayShortUtc(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: APP_DISPLAY_TIMEZONE,
    weekday: "short",
  }).format(date);
}
