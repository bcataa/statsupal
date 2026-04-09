-- incidents
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

alter table public.incidents add column if not exists user_id uuid references auth.users(id) on delete cascade;
