"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  generateNemesis,
  generatePraise,
  generateReport,
  type PetContext,
} from "@/lib/ai";
import { evaluateBadges } from "@/lib/badges";
import { maskProfanity } from "@/lib/moderation";
import type { Pet } from "@/lib/types";

async function loadPet(petId: string): Promise<Pet | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pets")
    .select("*")
    .eq("id", petId)
    .single();
  return (data as Pet | null) ?? null;
}

async function buildContext(userId: string): Promise<PetContext> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data: overdue } = await supabase
    .from("tasks")
    .select("title")
    .eq("user_id", userId)
    .lte("next_due_at", nowIso)
    .order("next_due_at", { ascending: true })
    .limit(8);

  const { data: recent } = await supabase
    .from("task_logs")
    .select("done_at, tasks(title)")
    .eq("user_id", userId)
    .order("done_at", { ascending: false })
    .limit(5);

  const { streakDays } = await evaluateBadges(supabase, userId);

  const recentDoneTitles = (recent ?? [])
    .map((r) => {
      const t = (r as { tasks: { title: string } | { title: string }[] | null })
        .tasks;
      if (!t) return null;
      return Array.isArray(t) ? t[0]?.title ?? null : t.title;
    })
    .filter((x): x is string => Boolean(x));

  return {
    overdueTitles: (overdue ?? []).map((t) => t.title as string),
    recentDoneTitles,
    streakDays,
  };
}

async function saveAlert(
  userId: string,
  petId: string,
  kind: "report" | "nemesis" | "praise",
  title: string,
  body: string
) {
  const supabase = await createClient();
  await supabase.from("alerts").insert({
    user_id: userId,
    pet_id: petId,
    kind,
    title: maskProfanity(title),
    body: maskProfanity(body),
  });
  revalidatePath("/");
  revalidatePath(`/pets/${petId}`);
}

export async function generateReportAction(formData: FormData) {
  const user = await requireUser();
  const petId = String(formData.get("pet_id") ?? "");
  const pet = petId ? await loadPet(petId) : null;
  if (!pet) return;

  const ctx = await buildContext(user.id);
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

  const ctx = await buildContext(user.id);
  const alert = await generatePraise(pet, ctx);
  await saveAlert(user.id, pet.id, "praise", alert.title, alert.body);
}
