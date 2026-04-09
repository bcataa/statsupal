-- service_check_history
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
