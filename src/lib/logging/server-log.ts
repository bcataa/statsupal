/**
 * Structured server logs with fixed prefixes. Never pass tokens, passwords, or raw Authorization headers.
 */

type LogPayload = Record<string, unknown> | undefined;

function formatMessage(prefix: string, msg: string, payload?: LogPayload): string {
  if (!payload || Object.keys(payload).length === 0) {
    return `${prefix} ${msg}`;
  }
  try {
    return `${prefix} ${msg} ${JSON.stringify(payload)}`;
  } catch {
    return `${prefix} ${msg}`;
  }
}

function monitoring(level: "info" | "warn" | "error", msg: string, payload?: LogPayload) {
  const line = formatMessage("[monitoring]", msg, payload);
  console[level](line);
}

function notifications(level: "info" | "warn" | "error", msg: string, payload?: LogPayload) {
  const line = formatMessage("[notifications]", msg, payload);
  console[level](line);
}

function api(level: "info" | "warn" | "error", msg: string, payload?: LogPayload) {
  const line = formatMessage("[api]", msg, payload);
  console[level](line);
}

function discord(level: "info" | "warn" | "error", msg: string, payload?: LogPayload) {
  const line = formatMessage("[discord]", msg, payload);
  console[level](line);
}

export const logMonitoring = {
  info: (msg: string, payload?: LogPayload) => monitoring("info", msg, payload),
  warn: (msg: string, payload?: LogPayload) => monitoring("warn", msg, payload),
  error: (msg: string, payload?: LogPayload) => monitoring("error", msg, payload),
};

export const logNotifications = {
  info: (msg: string, payload?: LogPayload) => notifications("info", msg, payload),
  warn: (msg: string, payload?: LogPayload) => notifications("warn", msg, payload),
  error: (msg: string, payload?: LogPayload) => notifications("error", msg, payload),
};

export const logApi = {
  info: (msg: string, payload?: LogPayload) => api("info", msg, payload),
  warn: (msg: string, payload?: LogPayload) => api("warn", msg, payload),
  error: (msg: string, payload?: LogPayload) => api("error", msg, payload),
};

export const logDiscord = {
  info: (msg: string, payload?: LogPayload) => discord("info", msg, payload),
  warn: (msg: string, payload?: LogPayload) => discord("warn", msg, payload),
  error: (msg: string, payload?: LogPayload) => discord("error", msg, payload),
};
