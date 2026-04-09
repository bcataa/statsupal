-- services
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

alter table public.services add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.services add column if not exists is_published boolean not null default true;
alter table public.services add column if not exists timeout_ms integer not null default 10000;
alter table public.services add column if not exists failure_threshold integer not null default 3;
alter table public.services add column if not exists retry_count integer not null default 0;
alter table public.services add column if not exists consecutive_failures integer not null default 0;

alter table public.services drop constraint if exists services_status_check;
alter table public.services
  add constraint services_status_check
  check (status in ('pending', 'operational', 'degraded', 'down'));
