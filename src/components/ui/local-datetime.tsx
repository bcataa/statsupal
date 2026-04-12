"use client";

import { formatDateTime, formatTimestampOrText } from "@/lib/utils/date-time";

type LocalDateTimeProps = {
  iso?: string | null;
  placeholder?: string;
};

/**
 * Renders an ISO instant in the viewer’s local timezone.
 * suppressHydrationWarning: server pre-render may use the host timezone; the client uses the browser.
 */
export function LocalDateTime({ iso, placeholder = "—" }: LocalDateTimeProps) {
  if (!iso) {
    return <span>{placeholder}</span>;
  }

  return (
    <time dateTime={iso} suppressHydrationWarning className="tabular-nums">
      {formatDateTime(iso)}
    </time>
  );
}

type LocalTimestampOrTextProps = {
  value: string;
};

export function LocalTimestampOrText({ value }: LocalTimestampOrTextProps) {
  return (
    <span suppressHydrationWarning className="tabular-nums">
      {formatTimestampOrText(value)}
    </span>
  );
}
