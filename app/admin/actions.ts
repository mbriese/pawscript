"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  adminCreateUserSchema,
  adminUpdatePasswordSchema,
  firstIssue,
  idSchema,
  type FormState,
} from "@/lib/validation";

export async function createUserAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = adminCreateUserSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });

  if (error) {
    return {
      error: /already|exist|registered/i.test(error.message)
        ? "A user with that email already exists."
        : "Could not create the user. Please try again.",
    };
  }

  revalidatePath("/admin");
  return { error: null, message: `Created ${parsed.data.email}.` };
}

export async function updatePasswordAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = adminUpdatePasswordSchema.safeParse({
    user_id: formData.get("user_id"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(parsed.data.user_id, {
    password: parsed.data.password,
  });

  if (error) return { error: "Could not update the password. Please try again." };

  revalidatePath("/admin");
  return { error: null, message: "Password updated." };
}

export async function markFlagReviewedAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const parsed = idSchema.safeParse(formData.get("flag_id"));
  if (!parsed.success) return;

  // Update via the RLS-scoped session client: the moderation_flags update
  // policy only permits admins (public.is_admin), so this exercises RLS.
  const supabase = await createClient();
  await supabase
    .from("moderation_flags")
    .update({
      status: "reviewed",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
    })
    .eq("id", parsed.data);

  revalidatePath("/admin");
}
