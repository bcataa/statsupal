/**
 * Shared date/time display for dashboard, incidents, services, settings, and public status.
 * Stored values remain ISO 8601 (UTC); formatting uses the runtime locale and local timezone
 * (browser on the client, host default on the server).
 */

/** IANA timezone for the current runtime (browser or server). */
export function getDefaultTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  } catch {
    return "UTC";
  }
}

function parseToDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === "") {
    return null;
  }
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Primary datetime in the viewer's local timezone, e.g. "Apr 7, 2026, 2:32 PM EDT". */
export function formatDateTime(iso: string | Date | null | undefined): string {
  const d = parseToDate(iso);
  if (!d) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
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

/** Calendar date only in local time (no time of day). */
export function formatDateLocal(iso: string | Date | null | undefined): string {
  const d = parseToDate(iso);
  if (!d) {
    return "—";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/** `YYYY-MM-DD` for the calendar day of `date` in `timeZone` (IANA), e.g. America/New_York. */
export function dayKeyInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Last `count` distinct local calendar days in `timeZone`, oldest first (for left-to-right charts).
 */
export function getLastNLocalDayKeysOldestFirst(
  timeZone: string,
  count: number,
  now: Date = new Date(),
): string[] {
  if (count <= 0 || Number.isNaN(now.getTime())) {
    return [];
  }

  const keysNewestFirst: string[] = [];
  let cursor = new Date(now);
  keysNewestFirst.push(dayKeyInTimeZone(cursor, timeZone));

  let guard = 0;
  while (keysNewestFirst.length < count && guard < count * 48) {
    cursor = new Date(cursor.getTime() - 60 * 60 * 1000);
    const key = dayKeyInTimeZone(cursor, timeZone);
    const last = keysNewestFirst[keysNewestFirst.length - 1];
    if (key !== last) {
      keysNewestFirst.push(key);
    }
    guard += 1;
  }

  return keysNewestFirst.reverse();
}

/** Weekday label (short) for a local calendar day key in `timeZone`. */
export function weekdayShortForLocalDayKey(dayKey: string, timeZone: string): string {
  const parts = dayKey.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return dayKey;
  }
  const [y, m, d] = parts;
  for (let h = 0; h < 24; h += 1) {
    const probe = new Date(Date.UTC(y, m - 1, d, h, 30, 0));
    if (dayKeyInTimeZone(probe, timeZone) === dayKey) {
      return new Intl.DateTimeFormat(undefined, { timeZone, weekday: "short" }).format(probe);
    }
  }
  const fallback = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat(undefined, { timeZone, weekday: "short" }).format(fallback);
}

/** Compact local hour range label for a 1h bucket in a rolling window (tooltips). */
export function formatLocalHourRangeLabel(windowStartMs: number, bucketIndex: number): string {
  const start = new Date(windowStartMs + bucketIndex * 60 * 60 * 1000);
  const end = new Date(windowStartMs + (bucketIndex + 1) * 60 * 60 * 1000);
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  const a = new Intl.DateTimeFormat(undefined, opts).format(start);
  const b = new Intl.DateTimeFormat(undefined, opts).format(end);
  return `${a} – ${b}`;
}
