-- Statsupal: full schema in one file (tables, indexes, RLS, policies, upgrades).
--
-- Supabase SQL Editor: you can paste and run this entire file for a new project, or use it
-- as the single reference for what the database should contain. It matches the combined
-- outcome of `supabase/migrations/*.sql` in timestamp order.
--
-- Incremental deploys: still use `supabase/migrations/` or `supabase db push` if you prefer.

create extension if not exists "pgcrypto";

-- Backward compatibility: some setups may have used singular "workspace".
-- Keep "workspaces" as canonical, and expose a read-only compatibility view.
drop view if exists public.workspace;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  project_name text not null default 'Main Status Page',
  project_slug text not null default 'main-status-page',
  incident_alerts_enabled boolean not null default true,
  maintenance_alerts_enabled boolean not null default true,
  incident_email_alerts_enabled boolean not null default false,
  maintenance_email_alerts_enabled boolean not null default false,
  discord_webhook_url text,
  alert_email text,
  support_email text,
  public_description text,
  custom_domain text,
  custom_domain_status text not null default 'unconfigured'
    check (custom_domain_status in ('unconfigured', 'pending_verification', 'verified', 'failed')),
  created_at timestamptz not null default now(),
  unique (user_id)
);

create view public.workspace as
select * from public.workspaces;

create table if not exists public.services (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  url text not null,
  is_published boolean not null default true,
  timeout_ms integer not null default 10000,
  failure_threshold integer not null default 3,
  retry_count integer not null default 0,
  status text not null check (status in ('pending', 'operational', 'degraded', 'down')),
  check_type text not null check (check_type in ('http', 'ping', 'api')),
  check_interval text not null,
  last_checked text not null,
  response_time_ms integer not null default 0,
  consecutive_failures integer not null default 0,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists services_user_id_idx on public.services(user_id);

create table if not exists public.service_check_history (
  id text primary key,
  service_id text not null references public.services(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  status text not null check (status in ('pending', 'operational', 'degraded', 'down')),
  response_time_ms integer not null default 0,
  checked_at timestamptz not null
);

create index if not exists service_check_history_user_id_idx
  on public.service_check_history(user_id, checked_at desc);

create table if not exists public.maintenance_windows (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  affected_service_ids text[] not null default '{}',
  status text not null check (status in ('scheduled', 'active', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists maintenance_windows_user_id_idx
  on public.maintenance_windows(user_id, starts_at desc);

create table if not exists public.incidents (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text,
  source text check (source in ('manual', 'monitoring')),
  affected_service_id text not null,
  status text not null check (status in ('investigating', 'identified', 'monitoring', 'resolved')),
  severity text not null check (severity in ('minor', 'major', 'critical')),
  started_at timestamptz not null,
  updated_at timestamptz not null,
  resolved_at timestamptz,
  resolution_summary text
);

create table if not exists public.incident_events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  incident_id text not null references public.incidents(id) on delete cascade,
  event_type text not null
    check (event_type in ('created', 'status_changed', 'monitoring', 'resolved', 'manual_update', 'maintenance_linked')),
  source text not null check (source in ('monitoring', 'manual', 'system')),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists incident_events_user_id_idx
  on public.incident_events(user_id, created_at desc);

create table if not exists public.alert_subscribers (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  incident_created boolean not null default true,
  incident_resolved boolean not null default true,
  maintenance_alerts boolean not null default true,
  token text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (workspace_id, email)
);

create table if not exists public.workspace_notification_secrets (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  discord_bot_token text,
  discord_bot_channel_id text,
  discord_guild_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

-- Legacy monitor_heartbeat: older migrations used last_cycle_* names.
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

comment on table public.monitor_heartbeat is
  'Updated by the Statsupal monitor (single instance). Used by /api/health/monitoring. Service role only.';

create index if not exists incidents_user_id_idx on public.incidents(user_id);
create unique index if not exists incidents_one_active_per_service_idx
  on public.incidents(user_id, affected_service_id)
  where status <> 'resolved';

-- Safety net for existing databases that were created manually.
alter table public.workspaces add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.workspaces add column if not exists incident_alerts_enabled boolean not null default true;
alter table public.workspaces add column if not exists maintenance_alerts_enabled boolean not null default true;
alter table public.workspaces add column if not exists incident_email_alerts_enabled boolean not null default false;
alter table public.workspaces add column if not exists maintenance_email_alerts_enabled boolean not null default false;
alter table public.workspaces add column if not exists discord_webhook_url text;
alter table public.workspaces add column if not exists alert_email text;
alter table public.workspaces add column if not exists support_email text;
alter table public.workspaces add column if not exists public_description text;
alter table public.workspaces add column if not exists custom_domain text;
alter table public.workspaces add column if not exists custom_domain_status text not null default 'unconfigured';
alter table public.workspace_notification_secrets add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.workspace_notification_secrets add column if not exists discord_bot_token text;
alter table public.workspace_notification_secrets add column if not exists discord_bot_channel_id text;
alter table public.workspace_notification_secrets add column if not exists discord_guild_id text;
alter table public.services add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.services add column if not exists is_published boolean not null default true;
alter table public.services add column if not exists timeout_ms integer not null default 10000;
alter table public.services add column if not exists failure_threshold integer not null default 3;
alter table public.services add column if not exists retry_count integer not null default 0;
alter table public.services add column if not exists consecutive_failures integer not null default 0;
alter table public.incidents add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.services drop constraint if exists services_status_check;
alter table public.services
  add constraint services_status_check
  check (status in ('pending', 'operational', 'degraded', 'down'));

alter table public.workspaces enable row level security;
alter table public.services enable row level security;
alter table public.incidents enable row level security;
alter table public.service_check_history enable row level security;
alter table public.maintenance_windows enable row level security;
alter table public.incident_events enable row level security;
alter table public.alert_subscribers enable row level security;
alter table public.workspace_notification_secrets enable row level security;
alter table public.monitor_heartbeat enable row level security;

drop policy if exists "Users can read own workspaces" on public.workspaces;
create policy "Users can read own workspaces"
  on public.workspaces
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own workspaces" on public.workspaces;
create policy "Users can insert own workspaces"
  on public.workspaces
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own workspaces" on public.workspaces;
create policy "Users can update own workspaces"
  on public.workspaces
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own workspaces" on public.workspaces;
create policy "Users can delete own workspaces"
  on public.workspaces
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own services" on public.services;
create policy "Users can read own services"
  on public.services
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own services" on public.services;
create policy "Users can insert own services"
  on public.services
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own services" on public.services;
create policy "Users can update own services"
  on public.services
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own services" on public.services;
create policy "Users can delete own services"
  on public.services
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own incidents" on public.incidents;
create policy "Users can read own incidents"
  on public.incidents
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own incidents" on public.incidents;
create policy "Users can insert own incidents"
  on public.incidents
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own incidents" on public.incidents;
create policy "Users can update own incidents"
  on public.incidents
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own incidents" on public.incidents;
create policy "Users can delete own incidents"
  on public.incidents
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own service history" on public.service_check_history;
create policy "Users can read own service history"
  on public.service_check_history
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own service history" on public.service_check_history;
create policy "Users can insert own service history"
  on public.service_check_history
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own service history" on public.service_check_history;
create policy "Users can update own service history"
  on public.service_check_history
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own service history" on public.service_check_history;
create policy "Users can delete own service history"
  on public.service_check_history
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own maintenance windows" on public.maintenance_windows;
create policy "Users can read own maintenance windows"
  on public.maintenance_windows
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own maintenance windows" on public.maintenance_windows;
create policy "Users can insert own maintenance windows"
  on public.maintenance_windows
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own maintenance windows" on public.maintenance_windows;
create policy "Users can update own maintenance windows"
  on public.maintenance_windows
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own maintenance windows" on public.maintenance_windows;
create policy "Users can delete own maintenance windows"
  on public.maintenance_windows
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own incident events" on public.incident_events;
create policy "Users can read own incident events"
  on public.incident_events
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own incident events" on public.incident_events;
create policy "Users can insert own incident events"
  on public.incident_events
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own incident events" on public.incident_events;
create policy "Users can update own incident events"
  on public.incident_events
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own incident events" on public.incident_events;
create policy "Users can delete own incident events"
  on public.incident_events
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Public can subscribe alerts" on public.alert_subscribers;
create policy "Public can subscribe alerts"
  on public.alert_subscribers
  for insert
  with check (true);

drop policy if exists "Public can update own token alerts" on public.alert_subscribers;
create policy "Public can update own token alerts"
  on public.alert_subscribers
  for update
  using (true)
  with check (true);

drop policy if exists "Users can read own workspace subscribers" on public.alert_subscribers;
create policy "Users can read own workspace subscribers"
  on public.alert_subscribers
  for select
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = alert_subscribers.workspace_id and w.user_id = auth.uid()
    )
  );

drop policy if exists "Users can manage own workspace notification secrets" on public.workspace_notification_secrets;
create policy "Users can manage own workspace notification secrets"
  on public.workspace_notification_secrets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Quick validation checks (run manually in SQL Editor)
-- select id, user_id from public.workspaces limit 1;
-- select id, user_id from public.services limit 1;
-- select id, user_id from public.incidents limit 1;

-- Debug-only RLS bypass (temporarily uncomment, then revert immediately)
-- alter table public.workspaces disable row level security;
-- alter table public.services disable row level security;
-- alter table public.incidents disable row level security;
