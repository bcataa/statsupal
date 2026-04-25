-- Extra status page branding: dark logo + per-state colors (json for forward compatibility)
alter table public.workspaces
  add column if not exists status_page_extra_theme jsonb;

comment on column public.workspaces.status_page_extra_theme is
  'JSON: { logoDarkUrl, degradedColor, partialOutageColor, majorOutageColor, maintenanceColor, notStartedColor }';
