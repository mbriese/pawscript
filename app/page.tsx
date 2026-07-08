import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadDemoPet } from "@/app/actions/pets";
import { SiteHeader } from "@/components/site-header";
import { TaskItem } from "@/components/task-item";
import { DispatchFeed, type AlertRow } from "@/components/dispatch-feed";
import { BadgeShelf } from "@/components/badge-shelf";
import { PetActions } from "@/components/pet-actions";
import { SubmitButton } from "@/components/submit-button";
import { isOverdue } from "@/lib/scheduling";
import type { Badge, Pet, TaskWithPet } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [petsRes, tasksRes, alertsRes, catalogRes, userBadgesRes] =
    await Promise.all([
      supabase.from("pets").select("*").order("created_at", { ascending: true }),
      supabase
        .from("tasks")
        .select("*, pet:pets(id, name, avatar_emoji)")
        .order("next_due_at", { ascending: true, nullsFirst: false }),
      supabase
        .from("alerts")
        .select("*, pet:pets(name, avatar_emoji)")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("badges").select("*").order("key", { ascending: true }),
      supabase.from("user_badges").select("badge_key"),
    ]);

  const pets = (petsRes.data ?? []) as Pet[];
  const tasks = (tasksRes.data ?? []) as TaskWithPet[];
  const alerts = (alertsRes.data ?? []) as unknown as AlertRow[];
  const catalog = (catalogRes.data ?? []) as Badge[];
  const earnedKeys = new Set(
    (userBadgesRes.data ?? []).map((b) => b.badge_key as string)
  );

  const activePet = pets[0];
  const petTasks = tasks.filter((t) => t.subject === "pet");
  const humanTasks = tasks.filter((t) => t.subject === "human");
  const overdueCount = tasks.filter((t) => isOverdue(t.next_due_at)).length;

  return (
    <>
      <SiteHeader email={user.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {pets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-8">
            <section className="rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 p-6 text-white shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">
                    {activePet.avatar_emoji} {activePet.name} reporting for duty
                  </h1>
                  <p className="mt-1 text-white/85">
                    {overdueCount > 0
                      ? `${overdueCount} item${overdueCount === 1 ? "" : "s"} require your immediate attention.`
                      : "All protocols current. Suspiciously so."}
                  </p>
                </div>
                <PetActions petId={activePet.id} showPraise />
              </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="flex flex-col gap-8 lg:col-span-2">
                <TaskColumn
                  title="Pet tasks"
                  emoji="🐾"
                  tasks={petTasks}
                  showPet
                />
                <TaskColumn
                  title="Human tasks"
                  emoji="🧍"
                  tasks={humanTasks}
                />

                <section>
                  <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Recent dispatches
                  </h2>
                  <DispatchFeed alerts={alerts} />
                </section>
              </div>

              <aside className="flex flex-col gap-6">
                <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                  <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Badge shelf
                  </h2>
                  <BadgeShelf catalog={catalog} earnedKeys={earnedKeys} />
                </section>

                <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                  <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Your pets
                  </h2>
                  <ul className="flex flex-col gap-1">
                    {pets.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/pets/${p.id}`}
                          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          <span className="text-lg">{p.avatar_emoji}</span>
                          {p.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/pets/new"
                    className="mt-3 block rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-center text-sm font-medium text-zinc-500 transition hover:border-amber-400 hover:text-amber-600 dark:border-zinc-700"
                  >
                    + Add a pet
                  </Link>
                </section>
              </aside>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function TaskColumn({
  title,
  emoji,
  tasks,
  showPet = false,
}: {
  title: string;
  emoji: string;
  tasks: TaskWithPet[];
  showPet?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        <span aria-hidden>{emoji}</span> {title}
        <span className="text-sm font-normal text-zinc-400">({tasks.length})</span>
      </h2>
      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Nothing here yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((t) => (
            <TaskItem key={t.id} task={t} showPet={showPet} />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mb-4 text-6xl">🐾</div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Welcome to PawScript
      </h1>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">
        Add your first pet to start tracking care tasks — or load a demo pet to
        see the whole thing in action.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <form action={loadDemoPet} className="w-full">
          <SubmitButton
            pendingLabel="Summoning a cat…"
            className="w-full rounded-xl bg-amber-500 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-amber-600"
          >
            🐱 Load demo pet
          </SubmitButton>
        </form>
        <Link
          href="/pets/new"
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Create a pet from scratch
        </Link>
      </div>
    </div>
  );
}
