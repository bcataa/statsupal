# Supabase migrations

Apply in filename order (timestamp prefix). For new projects or CI, run via [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase db push
```

The monolithic `../schema.sql` remains as a reference snapshot; prefer these migrations for incremental, production-safe changes. All statements use `IF NOT EXISTS` / `IF EXISTS` where applicable and do not truncate user data.
