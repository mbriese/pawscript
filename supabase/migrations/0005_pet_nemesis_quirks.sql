-- Add per-pet nemesis and quirks fields used to personalize dispatches.

alter table public.pets
  add column if not exists nemesis text,
  add column if not exists quirks text;
