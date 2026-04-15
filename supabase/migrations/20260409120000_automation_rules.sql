-- Outbound webhook automations (service down, incidents). Statsupal never runs shell commands.

create table if not exists public.automation_rules (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Automation',
  trigger_type text not null
    check (trigger_type in ('service_down', 'incident_created', 'incident_resolved')),
  webhook_url text not null,
  secret text,
  cooldown_minutes integer not null default 5,
  enabled boolean not null default true,
  retry_enabled boolean not null default true,
  last_triggered_at timestamptz,
  last_delivery_status text
    check (last_delivery_status is null or last_delivery_status in ('success', 'failed')),
  last_http_status integer,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists automation_rules_workspace_idx
  on public.automation_rules (workspace_id);

create index if not exists automation_rules_user_idx
  on public.automation_rules (user_id);

create table if not exists public.automation_webhook_logs (
  id text primary key,
  rule_id text not null references public.automation_rules(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_type text not null,
  attempt_number integer not null,
  success boolean not null,
  http_status integer,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists automation_webhook_logs_rule_idx
  on public.automation_webhook_logs (rule_id, created_at desc);

alter table public.automation_rules enable row level security;
alter table public.automation_webhook_logs enable row level security;

drop policy if exists "Users manage own automation rules" on public.automation_rules;
create policy "Users manage own automation rules"
  on public.automation_rules
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users read own automation logs" on public.automation_webhook_logs;
create policy "Users read own automation logs"
  on public.automation_webhook_logs
  for select
  using (
    exists (
      select 1 from public.automation_rules r
      where r.id = automation_webhook_logs.rule_id and r.user_id = auth.uid()
    )
  );

comment on table public.automation_rules is
  'User-defined outbound webhooks; delivery uses service role from monitoring/API.';
