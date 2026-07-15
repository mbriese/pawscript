import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { AddTaskForm } from "@/components/add-task-form";
import { TaskItem } from "@/components/task-item";
import { AccountMfa } from "./account-mfa";
import { AccountNotifications, type NotificationSettings } from "./account-notifications";
import { isOverdue } from "@/lib/scheduling";
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
  const currentTasks = tasks.filter((task) => !isOverdue(task.next_due_at)).length;
  const progress = tasks.length
    ? Math.round((currentTasks / tasks.length) * 100)
    : 0;

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

        <section className="mb-6 overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm dark:border-violet-950/60 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-linear-to-r from-violet-600 via-purple-600 to-fuchsia-500 px-6 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-2xl shadow-inner">
                🐾
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-100">
                  PawScript
                </p>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  Common Task Pad
                </h2>
                <p className="text-xs text-violet-100">
                  Shared human tasks, pet missions, and household operations.
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-2 text-right text-sm shadow-inner">
              <div className="font-semibold">{tasks.length} active tasks</div>
              <div className="text-xs text-violet-100">{progress}% current</div>
            </div>
          </div>

          <div className="grid gap-6 p-5 lg:grid-cols-[1fr_18rem]">
            <div className="flex flex-col gap-5">
              <TaskList
                title="Human tasks"
                emoji="🧍"
                tasks={humanTasks}
                accent="violet"
              />
              <TaskList
                title="Pet missions"
                emoji="🐾"
                tasks={petTasks}
                showPet
                accent="fuchsia"
              />
            </div>

            <aside className="flex flex-col gap-4">
              <section className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 dark:border-violet-900/60 dark:bg-violet-950/20">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-violet-900 dark:text-violet-100">
                  Filter tasks
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm dark:bg-zinc-900 dark:text-zinc-200">
                    <span>All tasks</span>
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/50 dark:text-violet-200">
                      {tasks.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm dark:bg-zinc-900 dark:text-zinc-200">
                    <span>Human tasks</span>
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/50 dark:text-violet-200">
                      {humanTasks.length}
                    </span>
                  </div>
                  {pets.map((pet) => (
                    <div
                      key={pet.id}
                      className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <span>
                        {pet.avatar_emoji} {pet.name}
                      </span>
                      <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-semibold text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-200">
                        {petTasks.filter((task) => task.pet_id === pet.id).length}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-violet-100 bg-white p-4 text-center shadow-sm dark:border-violet-900/60 dark:bg-zinc-900">
                <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                  Today&apos;s progress
                </h3>
                <div className="mx-auto mt-3 flex h-28 w-28 items-center justify-center rounded-full border-10 border-violet-200 bg-violet-50 text-2xl font-black text-violet-700 dark:border-violet-900/70 dark:bg-violet-950/30 dark:text-violet-200">
                  {progress}%
                </div>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {currentTasks} of {tasks.length} tasks are not overdue.
                </p>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-700 dark:text-zinc-200">
                  Add new task
                </h3>
                <AddTaskForm pets={pets} petSpecies={petSpecies} />
              </section>
            </aside>
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
  emoji,
  tasks,
  showPet = false,
  accent,
}: {
  title: string;
  emoji: string;
  tasks: TaskWithPet[];
  showPet?: boolean;
  accent: "violet" | "fuchsia";
}) {
  const badgeClass =
    accent === "violet"
      ? "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200"
      : "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-200";

  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
      <h3 className="mb-3 flex items-center justify-between text-sm font-black uppercase tracking-wide text-zinc-700 dark:text-zinc-200">
        <span>
          <span aria-hidden>{emoji}</span> {title}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs ${badgeClass}`}>
          {tasks.length}
        </span>
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
