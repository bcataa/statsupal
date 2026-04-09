-- workspaces + compatibility view + workspace column safety
create extension if not exists "pgcrypto";

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

create or replace view public.workspace as
select * from public.workspaces;

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
