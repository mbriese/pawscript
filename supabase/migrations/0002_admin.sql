-- PawScript admin console migration
-- Adds:
--   * profiles        - one row per auth user, carries a `role` ('user'|'admin')
--   * moderation_flags - profanity rejections logged for admin review
--   * is_admin(uuid)   - security-definer role check used by RLS + app helpers
--   * a trigger that provisions a profile for every new auth user and grants
--     the bootstrap admin (mindi.briese@gmail.com) the admin role automatically.

-- Profiles ----------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

-- Admin check -------------------------------------------------------------
-- SECURITY DEFINER so it can read profiles regardless of the caller's RLS,
-- which prevents recursion when profiles/moderation policies call it.

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'admin'
  );
$$;

-- Provision a profile for every new auth user. The bootstrap admin email is
-- granted the admin role on creation so it is admin no matter when it signs up.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when new.email = 'mindi.briese@gmail.com' then 'admin' else 'user' end
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users that already exist.
insert into public.profiles (id, email, role)
select
  u.id,
  u.email,
  case when u.email = 'mindi.briese@gmail.com' then 'admin' else 'user' end
from auth.users u
on conflict (id) do nothing;

-- Ensure the bootstrap admin is admin even if the profile already existed.
update public.profiles set role = 'admin'
where email = 'mindi.briese@gmail.com';

-- Moderation flags --------------------------------------------------------
-- One row per rejected profane input. Written server-side (service role) so
-- clients cannot forge or tamper with flags; readable/updatable only by admins.

create table if not exists public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  user_email text,
  field text not null,
  original_text text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null
);

create index if not exists moderation_flags_status_idx
  on public.moderation_flags (status, created_at desc);

-- Grants ------------------------------------------------------------------
-- When these tables are created outside the Supabase migration runner (e.g.
-- applied directly via psql), the standard role grants are not auto-applied.
-- Grant them explicitly so PostgREST (anon/authenticated) and the service role
-- can reach the tables; RLS below still governs which rows each role sees.

grant usage on schema public to anon, authenticated, service_role;
grant all on public.profiles to service_role;
grant select, update on public.profiles to authenticated;
grant all on public.moderation_flags to service_role;
grant select, update on public.moderation_flags to authenticated;

-- Row Level Security ------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.moderation_flags enable row level security;

-- profiles: a user reads/updates only their own row; admins read all.
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- moderation_flags: admin-only read + update. No insert/delete policy, so only
-- the service role (which bypasses RLS) can write flags.
drop policy if exists "moderation_flags_select_admin" on public.moderation_flags;
create policy "moderation_flags_select_admin" on public.moderation_flags
  for select using (public.is_admin(auth.uid()));

drop policy if exists "moderation_flags_update_admin" on public.moderation_flags;
create policy "moderation_flags_update_admin" on public.moderation_flags
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
