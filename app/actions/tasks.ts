"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { evaluateBadges } from "@/lib/badges";
import {
  completeTaskSchema,
  firstIssue,
  idSchema,
  taskSchema,
  type FormState,
} from "@/lib/validation";
import { isProfane } from "@/lib/moderation";
import { logModerationFlag } from "@/lib/admin";
import type { TaskCategory, TaskSubject } from "@/lib/types";

export async function createTask(formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    subject: formData.get("subject"),
    category: formData.get("category"),
    frequency: formData.get("frequency"),
    pet_id: formData.get("pet_id") ?? "",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  if (isProfane(parsed.data.title)) {
    await logModerationFlag({
      userId: user.id,
      userEmail: user.email ?? null,
      field: "task_title",
      originalText: parsed.data.title,
    });
    return { error: "Please remove inappropriate language from the task title." };
  }

  const subject = parsed.data.subject as TaskSubject;
  const category = parsed.data.category as TaskCategory;
  const pet_id = subject === "pet" && parsed.data.pet_id ? parsed.data.pet_id : null;

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    pet_id,
    title: parsed.data.title,
    subject,
    category,
    frequency: parsed.data.frequency,
    next_due_at: new Date().toISOString(),
  });

  if (error) return { error: "Could not add task. Please try again." };

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/pets");
  if (pet_id) revalidatePath(`/pets/${pet_id}`);
  return { error: null };
}

export async function completeTask(formData: FormData): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = completeTaskSchema.safeParse({
    task_id: formData.get("task_id"),
    pet_id: formData.get("pet_id") ?? "",
    note: formData.get("note") ?? "",
  });
  // Invalid input: reject silently (no note UI to surface it).
  if (!parsed.success) return;
  // Profane note: log for admin review, then reject silently.
  if (isProfane(parsed.data.note)) {
    await logModerationFlag({
      userId: user.id,
      userEmail: user.email ?? null,
      field: "task_note",
      originalText: parsed.data.note ?? "",
    });
    return;
  }

  const { error } = await supabase.rpc("complete_task", {
    p_task_id: parsed.data.task_id,
    p_note: parsed.data.note || null,
  });

  if (!error) {
    await evaluateBadges(supabase, user.id);
  }

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/pets");
  if (parsed.data.pet_id) revalidatePath(`/pets/${parsed.data.pet_id}`);
}

export async function deleteTask(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = idSchema.safeParse(formData.get("task_id"));
  if (!parsed.success) return;

  await supabase.from("tasks").delete().eq("id", parsed.data).eq("user_id", user.id);

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/pets");
  const petId = String(formData.get("pet_id") ?? "");
  if (petId) revalidatePath(`/pets/${petId}`);
}
