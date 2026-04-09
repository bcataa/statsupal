-- maintenance_windows
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
