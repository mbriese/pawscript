import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskCategory } from "./types";

interface LogRow {
  done_at: string;
  tasks:
    | {
        category: TaskCategory;
        subject?: string | null;
        pet?: { species: string | null } | { species: string | null }[] | null;
      }
    | {
        category: TaskCategory;
        subject?: string | null;
        pet?: { species: string | null } | { species: string | null }[] | null;
      }[]
    | null;
}

function taskOf(row: LogRow) {
  const t = row.tasks;
  if (!t) return null;
  return Array.isArray(t) ? t[0] ?? null : t;
}

function categoryOf(row: LogRow): TaskCategory | null {
  return taskOf(row)?.category ?? null;
}

function speciesOf(row: LogRow): string | null {
  const pet = taskOf(row)?.pet;
  if (!pet) return null;
  return Array.isArray(pet) ? pet[0]?.species ?? null : pet.species ?? null;
}

function localDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function currentStreak(logs: LogRow[]): number {
  const days = new Set(logs.map((l) => localDateKey(l.done_at)));
  if (days.size === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const keyFor = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const cursor = new Date(today);
  // Allow the streak to end today or yesterday.
  if (!days.has(keyFor(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(keyFor(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(keyFor(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

interface EvaluationResult {
  newlyEarned: string[];
  streakDays: number;
}

/**
 * Evaluates streak/threshold badges against the user's task_logs and inserts
 * any newly earned rows into user_badges. Returns the newly earned keys and the
 * current streak length.
 */
export async function evaluateBadges(
  supabase: SupabaseClient,
  userId: string
): Promise<EvaluationResult> {
  const { data: logs } = await supabase
    .from("task_logs")
    .select("done_at, tasks(category, subject, pet:pets(species))")
    .eq("user_id", userId);

  const rows = (logs ?? []) as LogRow[];

  const counts: Record<string, number> = {};
  const speciesCounts: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    const cat = categoryOf(row);
    if (cat) counts[cat] = (counts[cat] ?? 0) + 1;
    const species = speciesOf(row);
    if (cat && species) {
      speciesCounts[species] ??= {};
      speciesCounts[species][cat] = (speciesCounts[species][cat] ?? 0) + 1;
    }
  }

  const streakDays = currentStreak(rows);

  const earned: string[] = [];
  if ((counts.hydration ?? 0) >= 5) earned.push("human_hydration");
  if ((counts.movement ?? 0) + (counts.exercise ?? 0) >= 5)
    earned.push("human_movement");
  if ((counts.household ?? 0) >= 5) earned.push("household_operator");
  if ((counts.adventure ?? 0) >= 5) earned.push("adventure_companion");
  if (streakDays >= 3) earned.push("streak_3");
  if (streakDays >= 7) earned.push("streak_7");

  const speciesTotal = (species: string, categories: TaskCategory[]) =>
    categories.reduce((sum, cat) => sum + (speciesCounts[species]?.[cat] ?? 0), 0);

  if (speciesTotal("cat", ["play"]) >= 5) earned.push("mouse_surveillance");
  if (speciesTotal("cat", ["household", "play"]) >= 5)
    earned.push("cat_countertop_cartographer");
  if (speciesTotal("dog", ["walk", "adventure"]) >= 5)
    earned.push("neighborhood_protector");
  if (speciesTotal("dog", ["household", "adventure"]) >= 5)
    earned.push("dog_delivery_defender");
  if (speciesTotal("horse", ["adventure", "movement", "walk"]) >= 5)
    earned.push("horse_trail_blazer");
  if (speciesTotal("horse", ["household"]) >= 5) earned.push("horse_stable_steward");
  if (speciesTotal("cow", ["wellness", "household"]) >= 5)
    earned.push("cow_pasture_philosopher");
  if (speciesTotal("highland cow", ["wellness", "household"]) >= 5)
    earned.push("highland_cow_weather_sage");
  if (speciesTotal("snake", ["wellness"]) >= 5)
    earned.push("snake_sunbeam_strategist");
  if (speciesTotal("mouse", ["adventure", "play"]) >= 5)
    earned.push("mouse_tiny_explorer");
  if (speciesTotal("rat", ["work", "adventure"]) >= 5)
    earned.push("rat_puzzle_master");
  if (speciesTotal("hamster", ["household", "adventure"]) >= 5)
    earned.push("hamster_tunnel_engineer");
  if (speciesTotal("chicken", ["household"]) >= 5)
    earned.push("chicken_backyard_commander");
  if (speciesTotal("duck", ["adventure", "wellness"]) >= 5)
    earned.push("duck_pond_optimist");
  if (speciesTotal("bird", ["household", "adventure"]) >= 5)
    earned.push("bird_airspace_admiral");
  if (speciesTotal("fish", ["wellness", "household"]) >= 5)
    earned.push("fish_tank_oracle");
  if (speciesTotal("rabbit", ["wellness", "adventure"]) >= 5)
    earned.push("rabbit_meadow_diplomat");
  if (speciesTotal("virtual pet", ["adventure", "work"]) >= 5)
    earned.push("virtual_pet_quest_keeper");

  const earnedUnique = Array.from(new Set(earned));

  if (earnedUnique.length === 0) return { newlyEarned: [], streakDays };

  const { data: existing } = await supabase
    .from("user_badges")
    .select("badge_key")
    .eq("user_id", userId);

  const owned = new Set((existing ?? []).map((b) => b.badge_key as string));
  const toInsert = earnedUnique.filter((key) => !owned.has(key));

  if (toInsert.length === 0) return { newlyEarned: [], streakDays };

  const { error } = await supabase
    .from("user_badges")
    .insert(toInsert.map((badge_key) => ({ user_id: userId, badge_key })));

  if (error) return { newlyEarned: [], streakDays };

  return { newlyEarned: toInsert, streakDays };
}
