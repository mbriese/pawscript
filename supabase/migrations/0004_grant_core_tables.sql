-- PawScript: grant Data API privileges on the initial (0001) tables.
--
-- 0001 created pets/tasks/task_logs/alerts/badges/user_badges and enabled RLS
-- with per-row policies, but never granted base table privileges to the API
-- roles. When these tables are applied outside Supabase's migration runner
-- (e.g. directly via psql), the standard role grants are NOT auto-applied, so
-- PostgREST rejects every query with "42501: permission denied for table ...".
-- RLS is only consulted AFTER a role already holds table privileges, so the
-- existing policies were never even reached. Grant them explicitly here to
-- match those policies; RLS still governs which rows each role can touch.

grant usage on schema public to anon, authenticated, service_role;

-- pets: owner has full CRUD (policies: select/insert/update/delete own).
grant select, insert, update, delete on public.pets to authenticated;
grant all on public.pets to service_role;

-- tasks: owner has full CRUD. service_role was granted in 0003; kept here for
-- completeness / idempotency.
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;

-- task_logs: owner may select/insert/delete (no update policy).
grant select, insert, delete on public.task_logs to authenticated;
grant all on public.task_logs to service_role;

-- alerts: owner may select/insert/delete (no update policy).
grant select, insert, delete on public.alerts to authenticated;
grant all on public.alerts to service_role;

-- badges: catalog readable by any authenticated user; writes via service role.
grant select on public.badges to authenticated;
grant all on public.badges to service_role;

-- user_badges: owner may select/insert/delete.
grant select, insert, delete on public.user_badges to authenticated;
grant all on public.user_badges to service_role;

-- auth_attempts: server-only (RLS enabled with no policies). Only the service
-- role touches it, but it still needs table privileges to do so.
grant all on public.auth_attempts to service_role;
