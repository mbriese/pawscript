-- PawScript notifications: per-user preferences, contact info, a delivery log,
-- and task reminder bookkeeping. Idempotent; safe to re-run via psql.

-- Preferences -------------------------------------------------------------
-- One channel choice per category. Reasonable defaults: task reminders by
-- email, reports and alerts off until the user opts in.

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reports text not null default 'off',
  task_reminders text not null default 'email',
  alerts text not null default 'off',
  updated_at timestamptz not null default now(),
  constraint notification_channel_reports
    check (reports in ('email', 'sms', 'both', 'off')),
  constraint notification_channel_task_reminders
    check (task_reminders in ('email', 'sms', 'both', 'off')),
  constraint notification_channel_alerts
    check (alerts in ('email', 'sms', 'both', 'off'))
);

-- Contact info ------------------------------------------------------------
-- Kept in a dedicated table (not profiles) so phone_verified and the OTP are
-- writable only by the server (service role), never by the user directly.

create table if not exists public.user_contacts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  notify_email text,
  phone text,
  phone_verified boolean not null default false,
  phone_otp text,
  phone_otp_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Delivery log ------------------------------------------------------------
-- Every send attempt (sent / skipped / failed) is recorded so mock mode is
-- fully visible in-app. Written only by the server (service role).

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  channel text not null check (channel in ('email', 'sms')),
  category text not null,
  to_address text,
  subject text,
  body text,
  status text not null check (status in ('sent', 'skipped', 'failed')),
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_created_idx
  on public.notifications (created_at desc);

-- Task reminder bookkeeping ----------------------------------------------
-- last_reminded_at makes the reminder job idempotent: a task is only re-sent
-- once its next_due_at advances past the last reminder (i.e. after completion).

alter table public.tasks
  add column if not exists last_reminded_at timestamptz;

-- Grants ------------------------------------------------------------------
-- New tables are not auto-exposed to the Data API roles, so grant explicitly.

grant usage on schema public to anon, authenticated, service_role;

grant all on public.notification_preferences to service_role;
grant select, insert, update on public.notification_preferences to authenticated;

grant all on public.user_contacts to service_role;
grant select on public.user_contacts to authenticated;

grant all on public.notifications to service_role;
grant select on public.notifications to authenticated;

-- The reminder service reads/updates tasks via the service role, but 0001 never
-- granted service_role access to tasks. Grant it here so scheduled reminders work.
grant all on public.tasks to service_role;

-- Row Level Security ------------------------------------------------------

alter table public.notification_preferences enable row level security;
alter table public.user_contacts enable row level security;
alter table public.notifications enable row level security;

-- preferences: user manages their own row.
drop policy if exists "notif_prefs_select_own" on public.notification_preferences;
create policy "notif_prefs_select_own" on public.notification_preferences
  for select using (auth.uid() = user_id);
drop policy if exists "notif_prefs_insert_own" on public.notification_preferences;
create policy "notif_prefs_insert_own" on public.notification_preferences
  for insert with check (auth.uid() = user_id);
drop policy if exists "notif_prefs_update_own" on public.notification_preferences;
create policy "notif_prefs_update_own" on public.notification_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- contacts: user may read their own row; all writes go through the service role
-- (so phone_verified / OTP cannot be forged by the client).
drop policy if exists "user_contacts_select_own" on public.user_contacts;
create policy "user_contacts_select_own" on public.user_contacts
  for select using (auth.uid() = user_id);

-- notifications: user reads their own; admins read all; writes via service role.
drop policy if exists "notifications_select_own_or_admin" on public.notifications;
create policy "notifications_select_own_or_admin" on public.notifications
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- Security hardening ------------------------------------------------------
-- Close a privilege-escalation gap from 0002: authenticated users could update
-- their own profiles row (including role) via PostgREST. Nothing in the app
-- performs authenticated profile writes (role is set by trigger/service role),
-- so revoke that capability. Admin/role changes happen only via service role.

revoke update on public.profiles from authenticated;
drop policy if exists "profiles_update_self" on public.profiles;

-- Optional: scheduling extensions (best-effort) ---------------------------
-- pg_cron/pg_net let Postgres call the reminders endpoint on a schedule. They
-- may be unavailable locally; guard so the migration never fails. Actual
-- scheduling is documented in the README (the DB cannot reach the app's SMTP
-- mock, so reminders run in the app via the secured endpoint / button).

do $$ begin
  execute 'create extension if not exists pg_cron';
exception when others then
  raise notice 'pg_cron not enabled: %', sqlerrm;
end $$;

do $$ begin
  execute 'create extension if not exists pg_net';
exception when others then
  raise notice 'pg_net not enabled: %', sqlerrm;
end $$;
