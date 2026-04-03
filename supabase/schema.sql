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
  discord_webhook_url text,
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

create index if not exists incidents_user_id_idx on public.incidents(user_id);
create unique index if not exists incidents_one_active_per_service_idx
  on public.incidents(user_id, affected_service_id)
  where status <> 'resolved';

-- Safety net for existing databases that were created manually.
alter table public.workspaces add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.workspaces add column if not exists incident_alerts_enabled boolean not null default true;
alter table public.workspaces add column if not exists maintenance_alerts_enabled boolean not null default true;
alter table public.workspaces add column if not exists discord_webhook_url text;
alter table public.workspaces add column if not exists custom_domain text;
alter table public.workspaces add column if not exists custom_domain_status text not null default 'unconfigured';
alter table public.services add column if not exists user_id uuid references auth.users(id) on delete cascade;
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

-- Quick validation checks (run manually in SQL Editor)
-- select id, user_id from public.workspaces limit 1;
-- select id, user_id from public.services limit 1;
-- select id, user_id from public.incidents limit 1;

-- Debug-only RLS bypass (temporarily uncomment, then revert immediately)
-- alter table public.workspaces disable row level security;
-- alter table public.services disable row level security;
-- alter table public.incidents disable row level security;
