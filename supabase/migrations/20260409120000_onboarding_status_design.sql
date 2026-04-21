-- Guided onboarding progress, status page publishing, and visual design for public pages.

alter table public.workspaces add column if not exists onboarding_wizard_step integer not null default 0;

alter table public.workspaces add column if not exists brand_color text;

alter table public.workspaces add column if not exists operational_color text;

alter table public.workspaces add column if not exists brand_logo_url text;

alter table public.workspaces add column if not exists brand_favicon_url text;

alter table public.workspaces add column if not exists status_page_published boolean not null default true;

alter table public.workspaces add column if not exists status_page_style text not null default 'standard';

alter table public.workspaces drop constraint if exists workspaces_status_page_style_check;

alter table public.workspaces
  add constraint workspaces_status_page_style_check
  check (status_page_style in ('standard', 'premium_dark'));

comment on column public.workspaces.onboarding_wizard_step is
  '0 = not started; 1–5 = wizard step; 6 = finished';

-- Treat existing workspaces as already onboarded so the dashboard banner only targets new accounts.
update public.workspaces set onboarding_wizard_step = 6 where onboarding_wizard_step = 0;
