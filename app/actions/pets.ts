"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { firstIssue, idSchema, petSchema, type FormState } from "@/lib/validation";
import { isProfane } from "@/lib/moderation";
import { logModerationFlag } from "@/lib/admin";

export async function createPet(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = petSchema.safeParse({
    name: formData.get("name"),
    species: formData.get("species"),
    breed: formData.get("breed"),
    avatar_emoji: formData.get("avatar_emoji"),
    personality: formData.get("personality"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { name, species, breed, avatar_emoji, personality } = parsed.data;

  const profanityChecks: { field: string; label: string; value: string | null | undefined }[] = [
    { field: "pet_name", label: "name", value: name },
    { field: "pet_breed", label: "breed", value: breed },
    { field: "pet_personality", label: "personality", value: personality },
  ];
  for (const check of profanityChecks) {
    if (isProfane(check.value)) {
      await logModerationFlag({
        userId: user.id,
        userEmail: user.email ?? null,
        field: check.field,
        originalText: check.value ?? "",
      });
      return { error: `Please remove inappropriate language from the ${check.label} field.` };
    }
  }

  const { data, error } = await supabase
    .from("pets")
    .insert({
      user_id: user.id,
      name,
      species,
      breed: breed || null,
      avatar_emoji,
      personality,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Could not create pet. Please try again." };

  revalidatePath("/pets");
  revalidatePath("/");
  redirect(`/pets/${data.id}`);
}

export async function deletePet(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = idSchema.safeParse(formData.get("pet_id"));
  if (!parsed.success) return;

  await supabase.from("pets").delete().eq("id", parsed.data).eq("user_id", user.id);

  revalidatePath("/pets");
  revalidatePath("/");
  redirect("/pets");
}

const DEMO_TASKS = [
  { title: "Morning medication", subject: "pet", category: "medication", frequency: "1 day", offsetHours: -6 },
  { title: "Evening walk", subject: "pet", category: "walk", frequency: "1 day", offsetHours: -2 },
  { title: "Hunt the red dot", subject: "pet", category: "play", frequency: "12 hours", offsetHours: 3 },
  { title: "Refill water bowl", subject: "pet", category: "hydration", frequency: "1 day", offsetHours: -0.5 },
  { title: "Drink a glass of water", subject: "human", category: "hydration", frequency: "4 hours", offsetHours: -1 },
  { title: "Stand up and stretch", subject: "human", category: "movement", frequency: "3 hours", offsetHours: 1 },
] as const;

export async function loadDemoPet() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: pet, error } = await supabase
    .from("pets")
    .insert({
      user_id: user.id,
      name: "Sir Reginald Whiskerton III",
      species: "cat",
      breed: "British Shorthair",
      avatar_emoji: "🐱",
      personality:
        "A dry, bureaucratic house cat who narrates domestic life like a mid-level government auditor. Speaks in clipped official memos and is deeply suspicious of squirrels.",
    })
    .select("id")
    .single();

  if (error || !pet) return;

  const now = Date.now();
  const rows = DEMO_TASKS.map((t) => ({
    user_id: user.id,
    pet_id: t.subject === "pet" ? pet.id : null,
    title: t.title,
    subject: t.subject,
    category: t.category,
    frequency: t.frequency,
    next_due_at: new Date(now + t.offsetHours * 3_600_000).toISOString(),
    last_done_at: new Date(now - 24 * 3_600_000).toISOString(),
  }));

  await supabase.from("tasks").insert(rows);

  revalidatePath("/");
  revalidatePath("/pets");
  redirect(`/pets/${pet.id}`);
}
