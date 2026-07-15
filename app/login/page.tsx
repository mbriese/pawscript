import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in · PawScript",
};
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const configured = isSupabaseConfigured();

  return (
    <main className="flex flex-1 items-center justify-center bg-linear-to-br from-violet-50 via-white to-fuchsia-50 px-4 py-16 dark:from-zinc-950 dark:via-zinc-900 dark:to-violet-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl">🐾</div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            PawScript
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Your pet is watching. And filing reports.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
          {configured ? (
            <LoginForm />
          ) : (
            <div className="rounded-lg bg-violet-50 px-4 py-3 text-sm text-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
              Supabase isn&apos;t configured yet. Add{" "}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
              <code className="font-mono">.env.local</code>, then restart the dev
              server.
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          By continuing you agree to let a small animal judge your habits.
        </p>
      </div>
    </main>
  );
}
