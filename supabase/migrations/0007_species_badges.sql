-- Species-aware badge catalog.
-- `species` is null for general/human badges and set for critter-specific badges.

alter table public.badges
  add column if not exists species text;

update public.badges
set species = 'cat',
    name = 'Mouse Surveillance',
    description = 'Completed 5 cat play/hunt operations. The perimeter is monitored.',
    criteria = '5 play/hunt completions for cats'
where key = 'mouse_surveillance';

update public.badges
set species = 'dog',
    name = 'Neighborhood Protector',
    description = 'Completed 5 dog walk/security operations. The block is secure.',
    criteria = '5 walk/adventure completions for dogs'
where key = 'neighborhood_protector';

insert into public.badges (key, name, description, emoji, criteria, species) values
  ('cat_countertop_cartographer', 'Countertop Cartographer', 'Completed 5 cat household/play operations. Forbidden surfaces have been mapped.', '🐈', '5 cat household/play completions', 'cat'),
  ('dog_delivery_defender', 'Delivery Defender', 'Completed 5 dog patrol/adventure operations. Trucks have been investigated.', '🐕', '5 dog household/adventure completions', 'dog'),
  ('horse_trail_blazer', 'Trail Blazer', 'Completed 5 horse adventure or movement tasks. The trail has been chosen.', '🐴', '5 horse adventure/movement completions', 'horse'),
  ('horse_stable_steward', 'Stable Steward', 'Completed 5 horse household care tasks. Quarters are refreshed and dignified.', '🏇', '5 horse household completions', 'horse'),
  ('cow_pasture_philosopher', 'Pasture Philosopher', 'Completed 5 cow wellness/household tasks. Calm wisdom has been restored.', '🐄', '5 cow/highland cow wellness or household completions', 'cow'),
  ('highland_cow_weather_sage', 'Weather Sage', 'Completed 5 highland cow wellness/household tasks. Grass quality has been assessed.', '🐮', '5 highland cow wellness or household completions', 'highland cow'),
  ('snake_sunbeam_strategist', 'Sunbeam Strategist', 'Completed 5 snake wellness tasks. Warmth and patience prevail.', '🐍', '5 snake wellness completions', 'snake'),
  ('mouse_tiny_explorer', 'Tiny Explorer', 'Completed 5 mouse adventure/play tasks. Small territories have been surveyed.', '🐭', '5 mouse adventure/play completions', 'mouse'),
  ('rat_puzzle_master', 'Puzzle Master', 'Completed 5 rat work/adventure tasks. Clever solutions have been documented.', '🐀', '5 rat work/adventure completions', 'rat'),
  ('hamster_tunnel_engineer', 'Tunnel Engineer', 'Completed 5 hamster household/adventure tasks. Infrastructure is operational.', '🐹', '5 hamster household/adventure completions', 'hamster'),
  ('chicken_backyard_commander', 'Backyard Commander', 'Completed 5 chicken household/security tasks. Shadows remain under review.', '🐔', '5 chicken household completions', 'chicken'),
  ('duck_pond_optimist', 'Pond Optimist', 'Completed 5 duck adventure/wellness tasks. Puddles have been appreciated.', '🦆', '5 duck adventure/wellness completions', 'duck'),
  ('bird_airspace_admiral', 'Airspace Admiral', 'Completed 5 bird household/adventure tasks. Local skies are supervised.', '🐦', '5 bird household/adventure completions', 'bird'),
  ('fish_tank_oracle', 'Tank Oracle', 'Completed 5 fish wellness/household tasks. The waters are calm.', '🐠', '5 fish wellness/household completions', 'fish'),
  ('rabbit_meadow_diplomat', 'Meadow Diplomat', 'Completed 5 rabbit wellness/adventure tasks. Drama has been avoided.', '🐰', '5 rabbit wellness/adventure completions', 'rabbit'),
  ('virtual_pet_quest_keeper', 'Quest Keeper', 'Completed 5 virtual pet adventure/work tasks. The quest log is thriving.', '🐉', '5 virtual pet adventure/work completions', 'virtual pet'),
  ('household_operator', 'Household Operator', 'Completed 5 household operations across the home.', '🏠', '5 household completions', null),
  ('adventure_companion', 'Adventure Companion', 'Completed 5 adventure tasks. Momentum has been logged.', '🗺️', '5 adventure completions', null)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  emoji = excluded.emoji,
  criteria = excluded.criteria,
  species = excluded.species;
