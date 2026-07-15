import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Create account · PawScript" };
export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const configured = isSupabaseConfigured();

  return (
    <main className="flex flex-1 items-center justify-center bg-linear-to-br from-violet-50 via-white to-fuchsia-50 px-4 py-16 dark:from-zinc-950 dark:via-zinc-900 dark:to-violet-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl">🐾</div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create your account
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Start tracking care tasks — and get judged for it.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
          {configured ? (
            <SignupForm />
          ) : (
            <div className="rounded-lg bg-violet-50 px-4 py-3 text-sm text-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
              Supabase isn&apos;t configured yet. Add your env vars to{" "}
              <code className="font-mono">.env.local</code> and restart.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
