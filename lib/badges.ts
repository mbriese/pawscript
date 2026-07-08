import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskCategory } from "./types";

interface LogRow {
  done_at: string;
  tasks: { category: TaskCategory } | { category: TaskCategory }[] | null;
}

function categoryOf(row: LogRow): TaskCategory | null {
  const t = row.tasks;
  if (!t) return null;
  return Array.isArray(t) ? t[0]?.category ?? null : t.category;
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
    .select("done_at, tasks(category)")
    .eq("user_id", userId);

  const rows = (logs ?? []) as LogRow[];

  const counts: Record<string, number> = {};
  for (const row of rows) {
    const cat = categoryOf(row);
    if (cat) counts[cat] = (counts[cat] ?? 0) + 1;
  }

  const streakDays = currentStreak(rows);

  const earned: string[] = [];
  if ((counts.play ?? 0) >= 5) earned.push("mouse_surveillance");
  if ((counts.walk ?? 0) >= 5) earned.push("neighborhood_protector");
  if ((counts.hydration ?? 0) >= 5) earned.push("human_hydration");
  if ((counts.movement ?? 0) + (counts.exercise ?? 0) >= 5)
    earned.push("human_movement");
  if (streakDays >= 3) earned.push("streak_3");
  if (streakDays >= 7) earned.push("streak_7");

  if (earned.length === 0) return { newlyEarned: [], streakDays };

  const { data: existing } = await supabase
    .from("user_badges")
    .select("badge_key")
    .eq("user_id", userId);

  const owned = new Set((existing ?? []).map((b) => b.badge_key as string));
  const toInsert = earned.filter((key) => !owned.has(key));

  if (toInsert.length === 0) return { newlyEarned: [], streakDays };

  const { error } = await supabase
    .from("user_badges")
    .insert(toInsert.map((badge_key) => ({ user_id: userId, badge_key })));

  if (error) return { newlyEarned: [], streakDays };

  return { newlyEarned: toInsert, streakDays };
}
