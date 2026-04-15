-- If 20260409120000 ran before name column existed, add it.
alter table public.automation_rules
  add column if not exists name text not null default 'Automation';
