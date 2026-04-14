# Supabase migrations

Apply in filename order (timestamp prefix). For new projects or CI, run via [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase db push
```

The monolithic [`../schema.sql`](../schema.sql) is the **full schema in one file** (same end state as all migrations together, including `monitor_heartbeat` upgrades and comments). You can paste the whole file in the SQL Editor for a greenfield project or as documentation.

Prefer these migration files for incremental, production-safe changes. Statements use `IF NOT EXISTS` / `IF EXISTS` where applicable and do not truncate user data.
