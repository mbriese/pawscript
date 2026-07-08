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

export type UserRole = "user" | "admin";

export interface Profile {
  id: string;
  email: string | null;
  role: UserRole;
  created_at: string;
}

export type NotificationChannel = "email" | "sms" | "both" | "off";
export type NotificationCategory = "reports" | "task_reminders" | "alerts";
export type NotificationDeliveryChannel = "email" | "sms";
export type NotificationStatus = "sent" | "skipped" | "failed";

export interface NotificationPreferences {
  user_id: string;
  reports: NotificationChannel;
  task_reminders: NotificationChannel;
  alerts: NotificationChannel;
  updated_at: string;
}

export interface UserContact {
  user_id: string;
  notify_email: string | null;
  phone: string | null;
  phone_verified: boolean;
  phone_otp: string | null;
  phone_otp_expires_at: string | null;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  user_id: string | null;
  channel: NotificationDeliveryChannel;
  category: string;
  to_address: string | null;
  subject: string | null;
  body: string | null;
  status: NotificationStatus;
  detail: string | null;
  created_at: string;
}

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "reports",
  "task_reminders",
  "alerts",
];

export const NOTIFICATION_CATEGORY_META: Record<
  NotificationCategory,
  { label: string; description: string }
> = {
  reports: {
    label: "Status reports",
    description: "When your pet files a status report.",
  },
  task_reminders: {
    label: "Task reminders",
    description: "When care tasks become overdue.",
  },
  alerts: {
    label: "Alerts & dispatches",
    description: "Nemesis dispatches and praise from your pet.",
  },
};

export type ModerationStatus = "open" | "reviewed";

export interface ModerationFlag {
  id: string;
  user_id: string | null;
  user_email: string | null;
  field: string;
  original_text: string;
  status: ModerationStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
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
