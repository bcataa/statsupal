-- workspace_notification_secrets
create table if not exists public.workspace_notification_secrets (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  discord_bot_token text,
  discord_bot_channel_id text,
  discord_guild_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspace_notification_secrets add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.workspace_notification_secrets add column if not exists discord_bot_token text;
alter table public.workspace_notification_secrets add column if not exists discord_bot_channel_id text;
alter table public.workspace_notification_secrets add column if not exists discord_guild_id text;
