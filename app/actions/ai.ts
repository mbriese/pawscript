"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  generateNemesis,
  generatePraise,
  generateRandomEvent,
  generateReport,
  type PetContext,
} from "@/lib/ai";
import { evaluateBadges } from "@/lib/badges";
import { maskProfanity } from "@/lib/moderation";
import { sendNotification } from "@/lib/notifications";
import type {
  AlertKind,
  EventSeverity,
  NotificationCategory,
  Pet,
} from "@/lib/types";

async function loadPet(petId: string): Promise<Pet | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pets")
    .select("*")
    .eq("id", petId)
    .single();
  return (data as Pet | null) ?? null;
}

async function buildContext(userId: string, petId: string): Promise<PetContext> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data: overdue } = await supabase
    .from("tasks")
    .select("title, subject, pet_id")
    .eq("user_id", userId)
    .lte("next_due_at", nowIso)
    .order("next_due_at", { ascending: true })
    .limit(8);

  const { data: recent } = await supabase
    .from("task_logs")
    .select("done_at, tasks(title, subject, pet_id)")
    .eq("user_id", userId)
    .order("done_at", { ascending: false })
    .limit(20);

  const { streakDays } = await evaluateBadges(supabase, userId);

  const isRelevantTask = (task: {
    subject?: string | null;
    pet_id?: string | null;
  }) => task.subject === "human" || task.pet_id === petId;

  const recentDoneTitles = (recent ?? [])
    .map((r) => {
      const t = (
        r as {
          tasks:
            | { title: string; subject: string | null; pet_id: string | null }
            | { title: string; subject: string | null; pet_id: string | null }[]
            | null;
        }
      ).tasks;
      if (!t) return null;
      const task = Array.isArray(t) ? t[0] : t;
      if (!task || !isRelevantTask(task)) return null;
      return task.title;
    })
    .filter((x): x is string => Boolean(x));

  return {
    overdueTitles: (overdue ?? [])
      .filter((t) =>
        isRelevantTask(t as { subject?: string | null; pet_id?: string | null })
      )
      .map((t) => t.title as string),
    recentDoneTitles,
    streakDays,
  };
}

// Reports notify under the "reports" category; nemesis + praise are "alerts".
function categoryForKind(kind: AlertKind): NotificationCategory {
  return kind === "report" ? "reports" : "alerts";
}

async function saveAlert(
  userId: string,
  petId: string,
  kind: AlertKind,
  title: string,
  body: string,
  severity?: EventSeverity
) {
  const supabase = await createClient();
  const safeTitle = maskProfanity(title);
  const safeBody = maskProfanity(body);
  await supabase.from("alerts").insert({
    user_id: userId,
    pet_id: petId,
    kind,
    severity: severity ?? null,
    title: safeTitle,
    body: safeBody,
  });

  await sendNotification({
    userId,
    category: categoryForKind(kind),
    subject: safeTitle,
    body: safeBody,
  });

  revalidatePath("/");
  revalidatePath(`/pets/${petId}`);
  revalidatePath("/account");
}

export async function generateReportAction(formData: FormData) {
  const user = await requireUser();
  const petId = String(formData.get("pet_id") ?? "");
  const pet = petId ? await loadPet(petId) : null;
  if (!pet) return;

  const ctx = await buildContext(user.id, pet.id);
  const alert = await generateReport(pet, ctx);
  await saveAlert(user.id, pet.id, "report", alert.title, alert.body);
}

export async function generateNemesisAction(formData: FormData) {
  const user = await requireUser();
  const petId = String(formData.get("pet_id") ?? "");
  const pet = petId ? await loadPet(petId) : null;
  if (!pet) return;

  const alert = await generateNemesis(pet);
  await saveAlert(user.id, pet.id, "nemesis", alert.title, alert.body);
}

export async function generatePraiseAction(formData: FormData) {
  const user = await requireUser();
  const petId = String(formData.get("pet_id") ?? "");
  const pet = petId ? await loadPet(petId) : null;
  if (!pet) return;

  const ctx = await buildContext(user.id, pet.id);
  const alert = await generatePraise(pet, ctx);
  await saveAlert(user.id, pet.id, "praise", alert.title, alert.body);
}

export async function generateRandomEventAction(formData: FormData) {
  const user = await requireUser();
  const petId = String(formData.get("pet_id") ?? "");
  const pet = petId ? await loadPet(petId) : null;
  if (!pet) return;

  const alert = await generateRandomEvent(pet);
  await saveAlert(
    user.id,
    pet.id,
    "event",
    alert.title,
    alert.body,
    alert.severity
  );
}
