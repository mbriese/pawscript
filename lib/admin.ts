import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import { getCurrentUser } from "./auth";
import { getSupabaseServiceRoleKey } from "./supabase/env";

/** The bootstrap admin account granted the admin role by the migration. */
export const BOOTSTRAP_ADMIN_EMAIL = "mindi.briese@gmail.com";

/** Reads the signed-in user's role from `profiles` (via RLS: own row). */
async function currentRole(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role ?? "user";
}

/** True when the current session belongs to an admin. Safe for logged-out users. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return (await currentRole(user.id)) === "admin";
}

/**
 * Server-side gate for admin routes/actions. Redirects anonymous users to
 * /login and non-admins to the dashboard. The role is checked against the DB,
 * never trusted from the client.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if ((await currentRole(user.id)) !== "admin") redirect("/");
  return user;
}

export interface ModerationFlagInput {
  userId: string | null;
  userEmail: string | null;
  field: string;
  originalText: string;
}

/**
 * Records a rejected profane input for admin review. Written with the service
 * role so it bypasses RLS and cannot be forged by clients. No-ops if the
 * service-role key is absent, and never throws into the caller's flow.
 */
export async function logModerationFlag(input: ModerationFlagInput): Promise<void> {
  if (!getSupabaseServiceRoleKey()) return;
  try {
    const admin = createAdminClient();
    await admin.from("moderation_flags").insert({
      user_id: input.userId,
      user_email: input.userEmail,
      field: input.field,
      original_text: input.originalText.slice(0, 2000),
      status: "open",
    });
  } catch {
    // Logging must never block the user-facing rejection.
  }
}
