export type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  avatar_emoji: string;
};

export type Task = {
  id: string;
  title: string;
  subject: "human" | "pet";
  pet_id: string | null;
  category: string;
  frequency: string;
  next_due_at: string | null;
};

export type DispatchAlert = {
  id: string;
  pet_id: string;
  kind: string;
  severity: string | null;
  title: string;
  body: string;
  created_at: string;
  pet: { name: string; avatar_emoji: string } | null;
};

export type DispatchAlertRow = Omit<DispatchAlert, "pet"> & {
  pet:
    | { name: string; avatar_emoji: string }[]
    | { name: string; avatar_emoji: string }
    | null;
};

export type AppTab = "dashboard" | "pets" | "account";

export type TaskSubject = "human" | "pet";
