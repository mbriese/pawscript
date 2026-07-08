"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { firstIssue, mfaCodeSchema, idSchema, type FormState } from "@/lib/validation";

export interface EnrollResult {
  error?: string;
  factorId?: string;
  qrCode?: string;
  secret?: string;
}

export async function enrollMfa(): Promise<EnrollResult> {
  await requireUser();
  const supabase = await createClient();

  // Clean up any dangling unverified TOTP factors before enrolling a new one.
  const { data: existing } = await supabase.auth.mfa.listFactors();
  for (const factor of existing?.totp ?? []) {
    if (factor.status !== "verified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
  });

  if (error || !data) {
    return { error: error?.message ?? "Could not start MFA enrollment." };
  }

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export async function verifyMfaEnrollment(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();

  const factorParse = idSchema.safeParse(formData.get("factor_id"));
  if (!factorParse.success) return { error: "Missing enrollment. Try again." };

  const codeParse = mfaCodeSchema.safeParse({ code: formData.get("code") });
  if (!codeParse.success) return { error: firstIssue(codeParse.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: factorParse.data,
    code: codeParse.data.code,
  });

  if (error) return { error: "Incorrect code. Please try again." };

  revalidatePath("/account");
  return { error: null, message: "Two-factor authentication is now enabled." };
}

export async function unenrollMfa(formData: FormData) {
  await requireUser();
  const factorParse = idSchema.safeParse(formData.get("factor_id"));
  if (!factorParse.success) return;

  const supabase = await createClient();
  await supabase.auth.mfa.unenroll({ factorId: factorParse.data });
  revalidatePath("/account");
}
