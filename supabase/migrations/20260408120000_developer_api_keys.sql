-- Customer developer API keys (hashed at rest; full secret shown only once on create).

create table if not exists public.developer_api_keys (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  key_hash text not null,
  key_prefix text not null,
  scopes text[] not null default '{}',
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists developer_api_keys_workspace_idx
  on public.developer_api_keys (workspace_id)
  where revoked_at is null;

create unique index if not exists developer_api_keys_active_hash_uidx
  on public.developer_api_keys (key_hash)
  where revoked_at is null;

alter table public.developer_api_keys enable row level security;

drop policy if exists "Users manage own developer API keys" on public.developer_api_keys;
create policy "Users manage own developer API keys"
  on public.developer_api_keys
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.developer_api_keys is
  'Hashed API keys for programmatic access. Verified with service role on public API routes.';
