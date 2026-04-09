/**
 * In-process snapshot of the last monitoring cycle (this Node.js process only).
 * For multi-instance deployments, use the `monitor_heartbeat` table via persistMonitorHeartbeat.
 */

type Snapshot = {
  lastCycleStartedAt: string | null;
  lastCycleCompletedAt: string | null;
  lastCycleError: string | null;
  lastServicesChecked: number | null;
  loopMarkedStartedAt: string | null;
};

const snapshot: Snapshot = {
  lastCycleStartedAt: null,
  lastCycleCompletedAt: null,
  lastCycleError: null,
  lastServicesChecked: null,
  loopMarkedStartedAt: null,
};

export function markMonitorLoopProcessStarted(): void {
  snapshot.loopMarkedStartedAt = new Date().toISOString();
}

export function recordMonitorCycleStartInMemory(startedAt?: string): void {
  snapshot.lastCycleStartedAt = startedAt ?? new Date().toISOString();
  snapshot.lastCycleError = null;
}

export function recordMonitorCycleEndInMemory(servicesChecked: number, error?: string): void {
  snapshot.lastCycleCompletedAt = new Date().toISOString();
  snapshot.lastServicesChecked = servicesChecked;
  snapshot.lastCycleError = error ?? null;
}

export function getMonitorRuntimeMemorySnapshot(): Readonly<Snapshot> {
  return { ...snapshot };
}
