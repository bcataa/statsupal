-- alert_subscribers
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
