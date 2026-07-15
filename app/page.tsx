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
        .limit(12),
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
  const currentTasks = tasks.length - overdueCount;
  const progress = tasks.length
    ? Math.round((currentTasks / tasks.length) * 100)
    : 0;

  const overdueForPet = (petId: string) =>
    tasks.filter((t) => t.pet_id === petId && isOverdue(t.next_due_at)).length;

  return (
    <>
      <SiteHeader email={user.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {pets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-6">
            {/* Active Pets section */}
            <section className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm dark:border-violet-950/60 dark:bg-zinc-900">
              <div className="bg-linear-to-r from-violet-600 via-purple-600 to-fuchsia-500 px-6 py-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-100">
                  PawScript
                </p>
                <h1 className="text-2xl font-black uppercase tracking-tight">
                  Active Pets
                </h1>
                <p className="text-xs text-violet-100">
                  {overdueCount > 0
                    ? `${overdueCount} item${overdueCount === 1 ? "" : "s"} across all pets require attention.`
                    : "All protocols current across all pets. Suspiciously so."}
                </p>
              </div>
              <div className="flex flex-col divide-y divide-violet-50 dark:divide-violet-950/40">
                {pets.map((pet) => {
                  const oc = overdueForPet(pet.id);
                  return (
                    <div
                      key={pet.id}
                      className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/pets/${pet.id}`}
                          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-2xl transition hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-950/50"
                        >
                          {pet.avatar_emoji}
                        </Link>
                        <div>
                          <Link
                            href={`/pets/${pet.id}`}
                            className="font-bold text-zinc-900 hover:text-violet-600 dark:text-zinc-100 dark:hover:text-violet-300"
                          >
                            {pet.name}
                          </Link>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {pet.species}
                            {pet.breed ? ` · ${pet.breed}` : ""}
                          </p>
                          {oc > 0 ? (
                            <p className="mt-0.5 text-xs font-semibold text-rose-500">
                              {oc} overdue
                            </p>
                          ) : (
                            <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                              All clear
                            </p>
                          )}
                        </div>
                      </div>
                      <PetActions petId={pet.id} showPraise />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Common Task Pad */}
            <section className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm dark:border-violet-950/60 dark:bg-zinc-900">
              {/* Task pad header */}
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
                      Shared tasks for all humans and pets.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/15 px-4 py-2 text-right text-sm shadow-inner">
                  <div className="font-semibold">{tasks.length} active tasks</div>
                  <div className="text-xs text-violet-100">{progress}% current</div>
                </div>
              </div>

              {/* Task pad body */}
              <div className="grid gap-5 p-5 lg:grid-cols-[1fr_18rem]">
                {/* Left: task lists */}
                <div className="flex flex-col gap-5">
                  <TaskColumn
                    title="Human tasks"
                    emoji="🧍"
                    tasks={humanTasks}
                    accent="violet"
                  />
                  <TaskColumn
                    title="Pet missions"
                    emoji="🐾"
                    tasks={petTasks}
                    showPet
                    accent="fuchsia"
                  />
                  <section>
                    <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                      Recent dispatches
                    </h2>
                    <DispatchFeed alerts={alerts} />
                  </section>
                </div>

                {/* Right: utility panel */}
                <aside className="flex flex-col gap-4">
                  {/* Filter / counts */}
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
                      {pets.map((p) => (
                        <Link
                          key={p.id}
                          href={`/pets/${p.id}`}
                          className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm transition hover:bg-violet-50 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-violet-950/30"
                        >
                          <span>
                            {p.avatar_emoji} {p.name}
                          </span>
                          <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-semibold text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-200">
                            {petTasks.filter((t) => t.pet_id === p.id).length}
                          </span>
                        </Link>
                      ))}
                      <Link
                        href="/pets/new"
                        className="mt-1 block rounded-xl border border-dashed border-violet-300 px-3 py-2 text-center text-xs font-medium text-violet-500 transition hover:border-violet-400 hover:text-violet-600 dark:border-violet-700"
                      >
                        + Add a pet
                      </Link>
                    </div>
                  </section>

                  {/* Progress ring */}
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

                  {/* Badges */}
                  <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                      Badge shelf
                    </h3>
                    <BadgeShelf
                      catalog={catalog}
                      earnedKeys={earnedKeys}
                      species={activePet.species}
                    />
                  </section>
                </aside>
              </div>
            </section>
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
      <h2 className="mb-3 flex items-center justify-between text-sm font-black uppercase tracking-wide text-zinc-700 dark:text-zinc-200">
        <span>
          <span aria-hidden>{emoji}</span> {title}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs ${badgeClass}`}>
          {tasks.length}
        </span>
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
            className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-violet-600"
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
