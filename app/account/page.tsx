import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { AddTaskForm } from "@/components/add-task-form";
import { TaskItem } from "@/components/task-item";
import { AccountMfa } from "./account-mfa";
import { AccountNotifications, type NotificationSettings } from "./account-notifications";
import type { NotificationChannel, NotificationLog, Pet, TaskWithPet } from "@/lib/types";

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

  const [{ data: prefs }, { data: contact }, { data: recent }, petsRes, tasksRes] = await Promise.all([
    supabase
      .from("notification_preferences")
      .select("reports, task_reminders, alerts")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_contacts")
      .select("notify_email, phone, phone_verified")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("pets")
      .select("id, name, avatar_emoji, species")
      .order("created_at", { ascending: true }),
    supabase
      .from("tasks")
      .select("*, pet:pets(id, name, avatar_emoji)")
      .order("next_due_at", { ascending: true, nullsFirst: false }),
  ]);

  const pets = (petsRes.data ?? []) as Pick<
    Pet,
    "id" | "name" | "avatar_emoji" | "species"
  >[];
  const petSpecies = Array.from(new Set(pets.map((pet) => pet.species)));
  const tasks = (tasksRes.data ?? []) as TaskWithPet[];
  const petTasks = tasks.filter((t) => t.subject === "pet");
  const humanTasks = tasks.filter((t) => t.subject === "human");

  const notificationSettings: NotificationSettings = {
    reports: (prefs?.reports as NotificationChannel) ?? "off",
    task_reminders: (prefs?.task_reminders as NotificationChannel) ?? "email",
    alerts: (prefs?.alerts as NotificationChannel) ?? "off",
    notifyEmail: (contact?.notify_email as string | null) ?? "",
    loginEmail: user.email ?? "",
    phone: (contact?.phone as string | null) ?? "",
    phoneVerified: Boolean(contact?.phone_verified),
    recent: (recent ?? []) as NotificationLog[],
  };

  return (
    <>
      <SiteHeader email={user.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
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
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Task dashboard
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Create care tasks for pets and habit tasks for humans from one place.
              </p>
            </div>
            <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              {tasks.length} active
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
            <AddTaskForm pets={pets} petSpecies={petSpecies} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <TaskList title="Human tasks" tasks={humanTasks} />
            <TaskList title="Pet tasks" tasks={petTasks} showPet />
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Two-factor authentication
          </h2>
          <AccountMfa verifiedFactors={verifiedFactors} />
        </section>

        <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Notifications
          </h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Choose how PawScript reaches you. Delivery is mocked locally — emails
            appear in Mailpit and every attempt is logged below.
          </p>
          <AccountNotifications settings={notificationSettings} />
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

function TaskList({
  title,
  tasks,
  showPet = false,
}: {
  title: string;
  tasks: TaskWithPet[];
  showPet?: boolean;
}) {
  return (
    <section>
      <h3 className="mb-3 flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        <span>{title}</span>
        <span>{tasks.length}</span>
      </h3>
      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No tasks here yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} showPet={showPet} />
          ))}
        </div>
      )}
    </section>
  );
}
