export type TaskSubject = "pet" | "human";

export type TaskCategory =
  | "walk"
  | "food"
  | "attention"
  | "play"
  | "medication"
  | "hydration"
  | "exercise"
  | "movement"
  | "other";

export type AlertKind = "nemesis" | "report" | "praise";

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: string;
  breed: string | null;
  avatar_emoji: string;
  personality: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  pet_id: string | null;
  title: string;
  subject: TaskSubject;
  category: TaskCategory;
  frequency: string;
  next_due_at: string | null;
  last_done_at: string | null;
  created_at: string;
}

export interface TaskLog {
  id: string;
  task_id: string;
  user_id: string;
  done_at: string;
  note: string | null;
}

export interface Alert {
  id: string;
  pet_id: string | null;
  user_id: string;
  kind: AlertKind;
  title: string;
  body: string;
  created_at: string;
}

export interface Badge {
  key: string;
  name: string;
  description: string;
  emoji: string;
  criteria: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_key: string;
  pet_id: string | null;
  earned_at: string;
}

export interface TaskWithPet extends Task {
  pet: Pick<Pet, "id" | "name" | "avatar_emoji"> | null;
}

export interface UserBadgeWithCatalog extends UserBadge {
  badge: Badge | null;
}

export const TASK_CATEGORIES: TaskCategory[] = [
  "walk",
  "food",
  "attention",
  "play",
  "medication",
  "hydration",
  "exercise",
  "movement",
  "other",
];

export const CATEGORY_META: Record<
  TaskCategory,
  { label: string; emoji: string }
> = {
  walk: { label: "Walk", emoji: "🦮" },
  food: { label: "Food", emoji: "🍖" },
  attention: { label: "Attention", emoji: "🫶" },
  play: { label: "Play / Hunt", emoji: "🎾" },
  medication: { label: "Medication", emoji: "💊" },
  hydration: { label: "Hydration", emoji: "💧" },
  exercise: { label: "Exercise", emoji: "🏃" },
  movement: { label: "Movement", emoji: "🚶" },
  other: { label: "Other", emoji: "📋" },
};
