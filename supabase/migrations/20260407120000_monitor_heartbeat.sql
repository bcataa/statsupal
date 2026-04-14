-- Single-row heartbeat for the monitoring worker (cross-process visibility, e.g. Railway).
-- Apply in Supabase: SQL Editor (paste & run) or `supabase db push` / `supabase migration up`.
-- The worker uses the service role key, which bypasses RLS.

create table if not exists public.monitor_heartbeat (
  id text primary key,
  last_started_at timestamptz,
  last_finished_at timestamptz,
  services_checked integer,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.monitor_heartbeat (id) values ('default')
  on conflict (id) do nothing;

-- Older copies of this migration used last_cycle_* column names; rename if present.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'monitor_heartbeat'
      and column_name = 'last_cycle_started_at'
  ) then
    alter table public.monitor_heartbeat rename column last_cycle_started_at to last_started_at;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'monitor_heartbeat'
      and column_name = 'last_cycle_completed_at'
  ) then
    alter table public.monitor_heartbeat rename column last_cycle_completed_at to last_finished_at;
  end if;
end $$;

alter table public.monitor_heartbeat
  add column if not exists created_at timestamptz not null default now();

alter table public.monitor_heartbeat enable row level security;

comment on table public.monitor_heartbeat is
  'Updated by the Statsupal monitor (single instance). Used by /api/health/monitoring. Service role only.';
