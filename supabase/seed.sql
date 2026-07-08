-- Optional demo seed for PawScript.
--
-- RLS makes rows user-scoped, so you must insert data for a real auth user.
-- Replace the UUID below with your own user id (Authentication → Users in the
-- Supabase dashboard), then run this in the SQL editor.
--
-- For the demo, the in-app "Load demo pet" button is easier: it creates the
-- same sample data for whoever is logged in, no manual UUID needed.

do $$
declare
  demo_user uuid := '00000000-0000-0000-0000-000000000000'; -- <-- replace me
  demo_pet uuid;
begin
  insert into public.pets (user_id, name, species, breed, avatar_emoji, personality)
  values (
    demo_user,
    'Sir Reginald Whiskerton III',
    'cat',
    'British Shorthair',
    '🐱',
    'A dry, bureaucratic house cat who narrates domestic life like a mid-level government auditor. Speaks in clipped, official memos and is deeply suspicious of squirrels.'
  )
  returning id into demo_pet;

  insert into public.tasks (user_id, pet_id, title, subject, category, frequency, next_due_at, last_done_at) values
    (demo_user, demo_pet, 'Morning medication', 'pet', 'medication', '1 day', now() - interval '6 hours', now() - interval '1 day 6 hours'),
    (demo_user, demo_pet, 'Evening walk', 'pet', 'walk', '1 day', now() - interval '2 hours', now() - interval '1 day 2 hours'),
    (demo_user, demo_pet, 'Hunt the red dot', 'pet', 'play', '12 hours', now() + interval '3 hours', now() - interval '9 hours'),
    (demo_user, demo_pet, 'Refill water bowl', 'pet', 'hydration', '1 day', now() - interval '30 minutes', now() - interval '1 day'),
    (demo_user, null, 'Drink a glass of water', 'human', 'hydration', '4 hours', now() - interval '1 hour', now() - interval '5 hours'),
    (demo_user, null, 'Stand up and stretch', 'human', 'movement', '3 hours', now() + interval '1 hour', now() - interval '2 hours');
end $$;
