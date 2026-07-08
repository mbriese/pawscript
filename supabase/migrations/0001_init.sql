-- PawScript initial schema
-- Tables: pets, tasks, task_logs, alerts, badges (catalog), user_badges
-- Row Level Security keyed to auth.uid() on all user-owned tables.

create extension if not exists "pgcrypto";

-- Enums -------------------------------------------------------------------

do $$ begin
  create type task_subject as enum ('pet', 'human');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_category as enum (
    'walk', 'food', 'attention', 'play', 'medication',
    'hydration', 'exercise', 'movement', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_kind as enum ('nemesis', 'report', 'praise');
exception when duplicate_object then null; end $$;

-- Tables ------------------------------------------------------------------

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  species text not null default 'cat',
  breed text,
  avatar_emoji text not null default '🐾',
  personality text not null default 'A dry, bureaucratic operative who files everything in triplicate.',
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete cascade,
  title text not null,
  subject task_subject not null default 'pet',
  category task_category not null default 'other',
  frequency interval not null default '1 day',
  next_due_at timestamptz,
  last_done_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.task_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  done_at timestamptz not null default now(),
  note text
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references public.pets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind alert_kind not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.badges (
  key text primary key,
  name text not null,
  description text not null,
  emoji text not null default '🏅',
  criteria text not null
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_key text not null references public.badges (key) on delete cascade,
  pet_id uuid references public.pets (id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_key)
);

-- Indexes -----------------------------------------------------------------

create index if not exists tasks_user_idx on public.tasks (user_id);
create index if not exists tasks_pet_idx on public.tasks (pet_id);
create index if not exists task_logs_user_idx on public.task_logs (user_id);
create index if not exists task_logs_task_idx on public.task_logs (task_id);
create index if not exists alerts_user_idx on public.alerts (user_id);
create index if not exists user_badges_user_idx on public.user_badges (user_id);

-- Row Level Security ------------------------------------------------------

alter table public.pets enable row level security;
alter table public.tasks enable row level security;
alter table public.task_logs enable row level security;
alter table public.alerts enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

-- pets
drop policy if exists "pets_select_own" on public.pets;
create policy "pets_select_own" on public.pets
  for select using (auth.uid() = user_id);
drop policy if exists "pets_insert_own" on public.pets;
create policy "pets_insert_own" on public.pets
  for insert with check (auth.uid() = user_id);
drop policy if exists "pets_update_own" on public.pets;
create policy "pets_update_own" on public.pets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "pets_delete_own" on public.pets;
create policy "pets_delete_own" on public.pets
  for delete using (auth.uid() = user_id);

-- tasks
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
  for select using (auth.uid() = user_id);
drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
  for insert with check (auth.uid() = user_id);
drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
  for delete using (auth.uid() = user_id);

-- task_logs
drop policy if exists "task_logs_select_own" on public.task_logs;
create policy "task_logs_select_own" on public.task_logs
  for select using (auth.uid() = user_id);
drop policy if exists "task_logs_insert_own" on public.task_logs;
create policy "task_logs_insert_own" on public.task_logs
  for insert with check (auth.uid() = user_id);
drop policy if exists "task_logs_delete_own" on public.task_logs;
create policy "task_logs_delete_own" on public.task_logs
  for delete using (auth.uid() = user_id);

-- alerts
drop policy if exists "alerts_select_own" on public.alerts;
create policy "alerts_select_own" on public.alerts
  for select using (auth.uid() = user_id);
drop policy if exists "alerts_insert_own" on public.alerts;
create policy "alerts_insert_own" on public.alerts
  for insert with check (auth.uid() = user_id);
drop policy if exists "alerts_delete_own" on public.alerts;
create policy "alerts_delete_own" on public.alerts
  for delete using (auth.uid() = user_id);

-- user_badges
drop policy if exists "user_badges_select_own" on public.user_badges;
create policy "user_badges_select_own" on public.user_badges
  for select using (auth.uid() = user_id);
drop policy if exists "user_badges_insert_own" on public.user_badges;
create policy "user_badges_insert_own" on public.user_badges
  for insert with check (auth.uid() = user_id);
drop policy if exists "user_badges_delete_own" on public.user_badges;
create policy "user_badges_delete_own" on public.user_badges
  for delete using (auth.uid() = user_id);

-- badges catalog: readable by any authenticated user
drop policy if exists "badges_select_all" on public.badges;
create policy "badges_select_all" on public.badges
  for select to authenticated using (true);

-- Completion RPC ----------------------------------------------------------
-- Writes a task_log and advances next_due_at by the task's frequency, in one
-- transaction. SECURITY INVOKER so RLS still applies (users touch only their
-- own tasks).

create or replace function public.complete_task(p_task_id uuid, p_note text default null)
returns void
language plpgsql
security invoker
as $$
declare
  v_user uuid := auth.uid();
  v_freq interval;
begin
  select frequency into v_freq
  from public.tasks
  where id = p_task_id and user_id = v_user;

  if not found then
    raise exception 'task not found or not owned by caller';
  end if;

  insert into public.task_logs (task_id, user_id, note)
  values (p_task_id, v_user, p_note);

  update public.tasks
  set last_done_at = now(),
      next_due_at = now() + coalesce(v_freq, interval '1 day')
  where id = p_task_id and user_id = v_user;
end;
$$;

-- Badge catalog seed ------------------------------------------------------

insert into public.badges (key, name, description, emoji, criteria) values
  ('mouse_surveillance', 'Mouse Surveillance', 'Logged 5 play/hunt operations. The perimeter is monitored.', '🐭', '5 play logs'),
  ('neighborhood_protector', 'Neighborhood Protector', 'Completed 5 walks. The block is secure.', '🦮', '5 walk logs'),
  ('human_hydration', 'Human Hydration', 'The human logged 5 hydration events. Fluids: acceptable.', '💧', '5 hydration logs'),
  ('human_movement', 'Human Movement', 'The human logged 5 movement/exercise events. Motility: confirmed.', '🚶', '5 movement/exercise logs'),
  ('streak_3', 'Three-Day Streak', 'Care tasks completed 3 days in a row.', '🔥', '3 consecutive days with a completion'),
  ('streak_7', 'Seven-Day Streak', 'Care tasks completed 7 days in a row. Exemplary compliance.', '⭐', '7 consecutive days with a completion')
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  emoji = excluded.emoji,
  criteria = excluded.criteria;

-- Login throttling --------------------------------------------------------
-- Records failed/successful sign-in attempts for app-level lockout. Written
-- only by the server via the service-role key. RLS is enabled with NO policies
-- so anon/authenticated clients can neither read nor write it.

create table if not exists public.auth_attempts (
  id uuid primary key default gen_random_uuid(),
  email text,
  ip text,
  succeeded boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index if not exists auth_attempts_email_idx
  on public.auth_attempts (email, attempted_at desc);
create index if not exists auth_attempts_ip_idx
  on public.auth_attempts (ip, attempted_at desc);

alter table public.auth_attempts enable row level security;
-- Intentionally no policies: only the service role (which bypasses RLS) may
-- access this table.
