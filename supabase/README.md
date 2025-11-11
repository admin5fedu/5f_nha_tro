# Supabase Migration Plan – Phase 1 (Schema)

This directory contains the baseline PostgreSQL schema that mirrors the legacy
SQLite/Firebase structure. Apply these scripts from the Supabase SQL editor or
via `supabase db push`.

## 1. Apply the schema

```sql
-- In Supabase SQL editor
\i supabase/schema.sql
```

This will create all working tables (`users`, `branches`, `rooms`, …) as well as
supporting tables like `roles`, `notifications`, `tasks`, etc. The schema also
includes indexes that match the original project.

**Key adjustments**

- `users.email` is now `NOT NULL UNIQUE`.
- `users.role_id` references `roles.id`.
- `users.auth_user_id` can point to `auth.users.id` when Supabase Auth is
  introduced in Phase 2.
- Monetary columns use `numeric`; timestamps default to `now()`.

## 2. Enable Row Level Security (optional for now)

RLS will be required once Supabase Auth is wired up. For Phase 1 you can enable
it on the critical tables but leave policies commented out:

```sql
alter table public.users enable row level security;
alter table public.user_branches enable row level security;
-- ...repeat for other tables you want to protect...
```

Sample policy template (edit to fit your roles/permissions):

```sql
create policy "Users visible to admins"
  on public.users for select
  using (
    exists (
      select 1
      from public.users u
      join public.roles r on r.id = u.role_id
      where u.auth_user_id = auth.uid()
        and r.code = 'admin'
    )
  );
```

## 3. Seed lookup data

`schema.sql` already inserts default roles. To import production data you can
export from SQLite/Firebase and insert via CSV or SQL scripts.

## 4. Next steps (Phase 2+)

1. Integrate Supabase Auth and map `auth.users.id` → `public.users.auth_user_id`.
2. Replace Firebase services in the React app with Supabase queries/RPC.
3. Update backend jobs (if any) to use Supabase service role keys instead of
   Firebase Admin SDK.
4. Remove all Firebase-specific code and environment variables once migration
   is complete.

> Keep this schema under version control. Any future adjustments (new tables,
> columns, constraints) should be appended to `schema.sql` or broken into
> incremental migration files.

