-- incident_events
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
