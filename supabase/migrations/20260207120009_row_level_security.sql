-- Row Level Security (idempotent policy recreation)
alter table public.workspaces enable row level security;
alter table public.services enable row level security;
alter table public.incidents enable row level security;
alter table public.service_check_history enable row level security;
alter table public.maintenance_windows enable row level security;
alter table public.incident_events enable row level security;
alter table public.alert_subscribers enable row level security;
alter table public.workspace_notification_secrets enable row level security;

drop policy if exists "Users can read own workspaces" on public.workspaces;
create policy "Users can read own workspaces"
  on public.workspaces for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own workspaces" on public.workspaces;
create policy "Users can insert own workspaces"
  on public.workspaces for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own workspaces" on public.workspaces;
create policy "Users can update own workspaces"
  on public.workspaces for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own workspaces" on public.workspaces;
create policy "Users can delete own workspaces"
  on public.workspaces for delete using (auth.uid() = user_id);

drop policy if exists "Users can read own services" on public.services;
create policy "Users can read own services"
  on public.services for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own services" on public.services;
create policy "Users can insert own services"
  on public.services for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own services" on public.services;
create policy "Users can update own services"
  on public.services for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own services" on public.services;
create policy "Users can delete own services"
  on public.services for delete using (auth.uid() = user_id);

drop policy if exists "Users can read own incidents" on public.incidents;
create policy "Users can read own incidents"
  on public.incidents for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own incidents" on public.incidents;
create policy "Users can insert own incidents"
  on public.incidents for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own incidents" on public.incidents;
create policy "Users can update own incidents"
  on public.incidents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own incidents" on public.incidents;
create policy "Users can delete own incidents"
  on public.incidents for delete using (auth.uid() = user_id);

drop policy if exists "Users can read own service history" on public.service_check_history;
create policy "Users can read own service history"
  on public.service_check_history for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own service history" on public.service_check_history;
create policy "Users can insert own service history"
  on public.service_check_history for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own service history" on public.service_check_history;
create policy "Users can update own service history"
  on public.service_check_history for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own service history" on public.service_check_history;
create policy "Users can delete own service history"
  on public.service_check_history for delete using (auth.uid() = user_id);

drop policy if exists "Users can read own maintenance windows" on public.maintenance_windows;
create policy "Users can read own maintenance windows"
  on public.maintenance_windows for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own maintenance windows" on public.maintenance_windows;
create policy "Users can insert own maintenance windows"
  on public.maintenance_windows for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own maintenance windows" on public.maintenance_windows;
create policy "Users can update own maintenance windows"
  on public.maintenance_windows for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own maintenance windows" on public.maintenance_windows;
create policy "Users can delete own maintenance windows"
  on public.maintenance_windows for delete using (auth.uid() = user_id);

drop policy if exists "Users can read own incident events" on public.incident_events;
create policy "Users can read own incident events"
  on public.incident_events for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own incident events" on public.incident_events;
create policy "Users can insert own incident events"
  on public.incident_events for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own incident events" on public.incident_events;
create policy "Users can update own incident events"
  on public.incident_events for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own incident events" on public.incident_events;
create policy "Users can delete own incident events"
  on public.incident_events for delete using (auth.uid() = user_id);

drop policy if exists "Public can subscribe alerts" on public.alert_subscribers;
create policy "Public can subscribe alerts"
  on public.alert_subscribers for insert with check (true);

drop policy if exists "Public can update own token alerts" on public.alert_subscribers;
create policy "Public can update own token alerts"
  on public.alert_subscribers for update using (true) with check (true);

drop policy if exists "Users can read own workspace subscribers" on public.alert_subscribers;
create policy "Users can read own workspace subscribers"
  on public.alert_subscribers for select using (
    exists (
      select 1 from public.workspaces w
      where w.id = alert_subscribers.workspace_id and w.user_id = auth.uid()
    )
  );

drop policy if exists "Users can manage own workspace notification secrets" on public.workspace_notification_secrets;
create policy "Users can manage own workspace notification secrets"
  on public.workspace_notification_secrets for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
