-- Single-row heartbeat for the monitoring worker (cross-process visibility on Railway).
-- Expect one instance to run checks; see README and monitor-loop / monitoring-worker comments.

create table if not exists public.monitor_heartbeat (
  id text primary key,
  last_cycle_started_at timestamptz,
  last_cycle_completed_at timestamptz,
  services_checked integer,
  last_error text,
  updated_at timestamptz not null default now()
);

insert into public.monitor_heartbeat (id) values ('default')
  on conflict (id) do nothing;

alter table public.monitor_heartbeat enable row level security;

comment on table public.monitor_heartbeat is
  'Updated by the Statsupal monitor (single instance). Used by /api/health/monitoring. Service role only.';
