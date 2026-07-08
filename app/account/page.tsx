import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { AccountMfa } from "./account-mfa";

export const metadata = { title: "Account · PawScript" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verifiedFactors = (factors?.totp ?? [])
    .filter((f) => f.status === "verified")
    .map((f) => ({
      id: f.id,
      friendlyName: f.friendly_name ?? null,
      status: f.status,
    }));

  return (
    <>
      <SiteHeader email={user.email} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Account &amp; security
        </h1>

        <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Profile
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Signed in as{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-200">
              {user.email}
            </span>
          </p>
        </section>

        <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Two-factor authentication
          </h2>
          <AccountMfa verifiedFactors={verifiedFactors} />
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Session
          </h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            You&apos;re automatically signed out after 30 minutes of inactivity.
          </p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-red-950/40"
            >
              Sign out
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
