"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServiceRoleKey } from "@/lib/supabase/env";
import {
  firstIssue,
  notificationPreferencesSchema,
  notifyEmailSchema,
  phoneCodeSchema,
  phoneSchema,
  type FormState,
} from "@/lib/validation";
import { sendDirectEmail, runRemindersForUser } from "@/lib/notifications";

const OTP_TTL_MINUTES = 10;

export async function updatePreferences(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();

  const parsed = notificationPreferencesSchema.safeParse({
    reports: formData.get("reports"),
    task_reminders: formData.get("task_reminders"),
    alerts: formData.get("alerts"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  // Written with the authenticated session client so RLS (user-owned) applies.
  const supabase = await createClient();
  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: user.id,
      reports: parsed.data.reports,
      task_reminders: parsed.data.task_reminders,
      alerts: parsed.data.alerts,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) return { error: "Could not save preferences. Please try again." };

  revalidatePath("/account");
  return { error: null, message: "Notification preferences saved." };
}

export async function updateNotifyEmail(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();

  const parsed = notifyEmailSchema.safeParse(formData.get("notify_email"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  if (!getSupabaseServiceRoleKey()) {
    return { error: "Notifications are not configured on this server." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("user_contacts").upsert(
    {
      user_id: user.id,
      notify_email: parsed.data ? parsed.data : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) return { error: "Could not save your email. Please try again." };

  revalidatePath("/account");
  return {
    error: null,
    message: parsed.data
      ? "Notification email saved."
      : "Notification email cleared; your login email will be used.",
  };
}

export async function startPhoneVerification(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();

  const parsed = phoneSchema.safeParse(formData.get("phone"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  if (!getSupabaseServiceRoleKey()) {
    return { error: "Notifications are not configured on this server." };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();

  const admin = createAdminClient();
  const { error } = await admin.from("user_contacts").upsert(
    {
      user_id: user.id,
      phone: parsed.data,
      phone_verified: false,
      phone_otp: code,
      phone_otp_expires_at: expires,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) return { error: "Could not start verification. Please try again." };

  // In mock mode the SMS driver only logs, so deliver the code by email too so
  // it is visible in Mailpit for the demo.
  await sendDirectEmail(
    user.id,
    "PawScript phone verification code",
    `Your PawScript phone verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    "phone_verification"
  );

  revalidatePath("/account");
  return {
    error: null,
    message:
      "Verification code sent (mock: check Mailpit / the notifications log below).",
  };
}

export async function verifyPhoneCode(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();

  const parsed = phoneCodeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  if (!getSupabaseServiceRoleKey()) {
    return { error: "Notifications are not configured on this server." };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("user_contacts")
    .select("phone_otp, phone_otp_expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data?.phone_otp || !data.phone_otp_expires_at) {
    return { error: "No verification in progress. Request a new code." };
  }
  if (new Date(data.phone_otp_expires_at).getTime() < Date.now()) {
    return { error: "That code has expired. Request a new one." };
  }
  if (data.phone_otp !== parsed.data.code) {
    return { error: "Incorrect code. Please try again." };
  }

  const { error } = await admin
    .from("user_contacts")
    .update({
      phone_verified: true,
      phone_otp: null,
      phone_otp_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
  if (error) return { error: "Could not verify your phone. Please try again." };

  revalidatePath("/account");
  return { error: null, message: "Phone number verified." };
}

export async function sendTestNotification(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  void formData;
  const user = await requireUser();

  const result = await sendDirectEmail(
    user.id,
    "PawScript test notification",
    "This is a test notification from PawScript. If you can read this, mock email delivery is working.",
    "test"
  );

  revalidatePath("/account");
  return result.status === "sent"
    ? { error: null, message: `Test email sent. ${result.detail}` }
    : { error: `Test failed: ${result.detail}` };
}

export async function runRemindersNow(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  void formData;
  const user = await requireUser();
  const { reminded } = await runRemindersForUser(user.id);
  revalidatePath("/account");
  return {
    error: null,
    message:
      reminded > 0
        ? `Sent a reminder covering ${reminded} overdue task${
            reminded === 1 ? "" : "s"
          }.`
        : "No overdue tasks needed a reminder right now.",
  };
}
