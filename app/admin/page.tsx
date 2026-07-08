import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleKey } from "@/lib/supabase/env";
import { SiteHeader } from "@/components/site-header";
import { SubmitButton } from "@/components/submit-button";
import { AdminUsers, type AdminUser } from "./admin-users";
import { markFlagReviewedAction } from "./actions";
import type { ModerationFlag, NotificationLog } from "@/lib/types";

export const metadata = { title: "Admin · PawScript" };
export const dynamic = "force-dynamic";

const FIELD_LABELS: Record<string, string> = {
  pet_name: "Pet name",
  pet_breed: "Pet breed",
  pet_personality: "Pet personality",
  task_title: "Task title",
  task_note: "Task note",
};

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

async function loadUsers(): Promise<AdminUser[]> {
  if (!getSupabaseServiceRoleKey()) return [];
  const admin = createAdminClient();

  const { data: listing } = await admin.auth.admin.listUsers({ perPage: 200 });
  const { data: profiles } = await admin.from("profiles").select("id, role");

  const roleById = new Map<string, string>(
    (profiles ?? []).map((p) => [p.id as string, (p.role as string) ?? "user"])
  );

  return (listing?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? null,
    createdAt: u.created_at ?? null,
    role: roleById.get(u.id) ?? "user",
    mfa: (u.factors ?? []).some((f) => f.status === "verified"),
  }));
}

async function loadFlags(): Promise<ModerationFlag[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("moderation_flags")
    .select("*")
    .order("created_at", { ascending: false });

  const flags = (data ?? []) as ModerationFlag[];
  // Unreviewed (open) first, newest within each group.
  return flags.sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    return b.created_at.localeCompare(a.created_at);
  });
}

async function loadNotifications(): Promise<NotificationLog[]> {
  // Admins may read all notifications via RLS (is_admin policy).
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as NotificationLog[];
}

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [users, flags, notifications] = await Promise.all([
    loadUsers(),
    loadFlags(),
    loadNotifications(),
  ]);
  const openCount = flags.filter((f) => f.status === "open").length;

  return (
    <>
      <SiteHeader email={admin.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Admin console</h1>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            admin
          </span>
        </div>

        <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            User management
          </h2>
          <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
            Create accounts and reset passwords. New passwords must meet the
            strong-password policy (12+ chars with upper, lower, number, symbol).
          </p>
          <AdminUsers users={users} />
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-1 flex items-center gap-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Profanity flags
            </h2>
            {openCount > 0 ? (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {openCount} open
              </span>
            ) : null}
          </div>
          <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
            Every rejected profane input is logged here for review. Unreviewed
            items appear first.
          </p>

          {flags.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              No profanity flags yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                    <th className="px-2 py-2 font-medium">User</th>
                    <th className="px-2 py-2 font-medium">Field</th>
                    <th className="px-2 py-2 font-medium">Flagged text</th>
                    <th className="px-2 py-2 font-medium">When</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {flags.map((flag) => (
                    <tr
                      key={flag.id}
                      className="border-b border-zinc-100 align-top dark:border-zinc-800/60"
                    >
                      <td className="px-2 py-3 text-zinc-700 dark:text-zinc-200">
                        {flag.user_email ?? "—"}
                      </td>
                      <td className="px-2 py-3 text-zinc-500 dark:text-zinc-400">
                        {fieldLabel(flag.field)}
                      </td>
                      <td className="max-w-[22rem] px-2 py-3">
                        <span className="break-words font-mono text-xs text-zinc-800 dark:text-zinc-200">
                          {flag.original_text}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-zinc-500 dark:text-zinc-400">
                        {new Date(flag.created_at).toLocaleString()}
                      </td>
                      <td className="px-2 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            flag.status === "open"
                              ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          }`}
                        >
                          {flag.status}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        {flag.status === "open" ? (
                          <form action={markFlagReviewedAction}>
                            <input type="hidden" name="flag_id" value={flag.id} />
                            <SubmitButton
                              pendingLabel="Saving…"
                              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            >
                              Mark reviewed
                            </SubmitButton>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Notification log
          </h2>
          <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
            The 50 most recent delivery attempts across all users (mock mode).
          </p>
          {notifications.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              No notifications yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                    <th className="px-2 py-2 font-medium">When</th>
                    <th className="px-2 py-2 font-medium">Channel</th>
                    <th className="px-2 py-2 font-medium">Category</th>
                    <th className="px-2 py-2 font-medium">To</th>
                    <th className="px-2 py-2 font-medium">Subject</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => (
                    <tr key={n.id} className="border-b border-zinc-100 align-top dark:border-zinc-800/60">
                      <td className="whitespace-nowrap px-2 py-2 text-zinc-500 dark:text-zinc-400">
                        {new Date(n.created_at).toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">{n.channel}</td>
                      <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">{n.category}</td>
                      <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">{n.to_address ?? "—"}</td>
                      <td className="px-2 py-2 text-zinc-700 dark:text-zinc-200">{n.subject}</td>
                      <td className="px-2 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 font-semibold ${
                            n.status === "sent"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : n.status === "skipped"
                                ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                                : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                          }`}
                        >
                          {n.status}
                        </span>
                      </td>
                      <td className="max-w-[16rem] px-2 py-2 text-zinc-500 dark:text-zinc-400">
                        {n.detail ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
