import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { MfaForm } from "./mfa-form";

export const metadata = { title: "Two-factor · PawScript" };
export const dynamic = "force-dynamic";

export default async function MfaChallengePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  // Already fully authenticated, or no second factor required.
  if (!aal || aal.currentLevel === "aal2" || aal.nextLevel !== "aal2") {
    redirect("/");
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-linear-to-br from-violet-50 via-white to-fuchsia-50 px-4 py-16 dark:from-zinc-950 dark:via-zinc-900 dark:to-violet-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mb-3 text-5xl">🔐</div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Two-factor verification
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
          <MfaForm />
        </div>
      </div>
    </main>
  );
}
