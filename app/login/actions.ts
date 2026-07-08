"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { checkLockout, recordAttempt } from "@/lib/rate-limit";
import {
  emailSchema,
  firstIssue,
  mfaCodeSchema,
  signInSchema,
  signUpSchema,
  type FormState,
} from "@/lib/validation";

async function getOrigin() {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) return origin;
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

async function getClientIp() {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headerList.get("x-real-ip") ?? "unknown";
}

const NOT_CONFIGURED: FormState = {
  error: "Supabase is not configured. Add your env vars to sign in.",
};

export async function signInWithMagicLink(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { error: error.message };

  return {
    error: null,
    message: "Check your inbox — we sent you a magic sign-in link.",
  };
}

export async function signInWithPassword(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { email, password } = parsed.data;
  const ip = await getClientIp();

  const lockout = await checkLockout(email, ip);
  if (lockout.locked) {
    return {
      error: `Too many failed attempts. Please try again in ${lockout.retryAfterMinutes} minute(s).`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    await recordAttempt(email, ip, false);
    return { error: "Invalid email or password." };
  }

  await recordAttempt(email, ip, true);

  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    redirect("/login/mfa");
  }

  redirect("/");
}

export async function signUpWithPassword(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { error: error.message };

  if (!data.session) {
    return {
      error: null,
      message:
        "Account created. Check your email to confirm your address, then sign in.",
    };
  }

  redirect("/");
}

export async function verifyMfaChallenge(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const parsed = mfaCodeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totp = factors?.totp?.[0];
  if (!totp) redirect("/");

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: totp.id,
    code: parsed.data.code,
  });

  if (error) return { error: "Incorrect code. Please try again." };

  redirect("/");
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=not-configured");
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth");
  }

  redirect(data.url);
}
