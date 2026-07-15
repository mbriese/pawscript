import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deletePet } from "@/app/actions/pets";
import { SiteHeader } from "@/components/site-header";
import { TaskItem } from "@/components/task-item";
import { AddTaskForm } from "@/components/add-task-form";
import { DispatchFeed, type AlertRow } from "@/components/dispatch-feed";
import { BadgeShelf } from "@/components/badge-shelf";
import { PetActions } from "@/components/pet-actions";
import { SubmitButton } from "@/components/submit-button";
import { CATEGORY_META, type Badge, type Pet, type TaskCategory, type TaskWithPet } from "@/lib/types";
import { formatDateTime } from "@/lib/scheduling";

interface LogRow {
  id: string;
  done_at: string;
  note: string | null;
  tasks: { title: string; category: TaskCategory } | null;
}

export const dynamic = "force-dynamic";

export default async function PetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: petData } = await supabase
    .from("pets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const pet = petData as Pet | null;
  if (!pet) notFound();

  const [tasksRes, logsRes, alertsRes, catalogRes, userBadgesRes] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*, pet:pets(id, name, avatar_emoji)")
        .eq("pet_id", id)
        .order("next_due_at", { ascending: true, nullsFirst: false }),
      supabase
        .from("task_logs")
        .select("id, done_at, note, tasks!inner(title, category, pet_id)")
        .eq("tasks.pet_id", id)
        .order("done_at", { ascending: false })
        .limit(20),
      supabase
        .from("alerts")
        .select("*, pet:pets(name, avatar_emoji)")
        .eq("pet_id", id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("badges").select("*").order("key", { ascending: true }),
      supabase.from("user_badges").select("badge_key"),
    ]);

  const tasks = (tasksRes.data ?? []) as TaskWithPet[];
  const logs = (logsRes.data ?? []) as unknown as LogRow[];
  const alerts = (alertsRes.data ?? []) as unknown as AlertRow[];
  const catalog = (catalogRes.data ?? []) as Badge[];
  const earnedKeys = new Set(
    (userBadgesRes.data ?? []).map((b) => b.badge_key as string)
  );

  return (
    <>
      <SiteHeader email={user.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Link
          href="/pets"
          className="text-sm text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to pets
        </Link>

        <section className="mt-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-6xl">{pet.avatar_emoji}</span>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {pet.name}
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {pet.breed ? `${pet.breed} · ` : ""}
                  {pet.species}
                </p>
                <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-300">
                  {pet.personality}
                </p>
                {pet.nemesis || pet.quirks ? (
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                    {pet.nemesis ? (
                      <div className="rounded-xl bg-violet-50 p-3 text-violet-900 dark:bg-violet-950/30 dark:text-violet-100">
                        <h2 className="text-xs font-semibold uppercase tracking-wide">
                          Nemesis / worries
                        </h2>
                        <p className="mt-1">{pet.nemesis}</p>
                      </div>
                    ) : null}
                    {pet.quirks ? (
                      <div className="rounded-xl bg-violet-50 p-3 text-violet-900 dark:bg-violet-950/30 dark:text-violet-100">
                        <h2 className="text-xs font-semibold uppercase tracking-wide">
                          Quirks
                        </h2>
                        <p className="mt-1">{pet.quirks}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
            <form action={deletePet}>
              <input type="hidden" name="pet_id" value={pet.id} />
              <SubmitButton
                pendingLabel="Removing…"
                className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
              >
                Delete pet
              </SubmitButton>
            </form>
          </div>
          <div className="mt-5">
            <PetActions petId={pet.id} showPraise />
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-8 lg:col-span-2">
            <section>
              <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Tasks
              </h2>
              <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <AddTaskForm
                  pets={[pet]}
                  defaultPetId={pet.id}
                  defaultSpecies={pet.species}
                  lockPet
                />
              </div>
              {tasks.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  No tasks for {pet.name} yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {tasks.map((t) => (
                    <TaskItem key={t.id} task={t} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                History
              </h2>
              {logs.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  No completions logged yet.
                </p>
              ) : (
                <ol className="relative ml-3 border-l border-zinc-200 dark:border-zinc-700">
                  {logs.map((log) => {
                    const cat = log.tasks?.category ?? "other";
                    return (
                      <li key={log.id} className="mb-4 ml-4">
                        <span className="absolute left-[-9px] flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white">
                          ✓
                        </span>
                        <div className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                          <span aria-hidden>{CATEGORY_META[cat].emoji}</span>
                          <span className="font-medium">
                            {log.tasks?.title ?? "Task"}
                          </span>
                        </div>
                        <time className="text-xs text-zinc-400">
                          {formatDateTime(log.done_at)}
                        </time>
                        {log.note ? (
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {log.note}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <section>
              <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Dispatches
              </h2>
              <DispatchFeed alerts={alerts} />
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Badges
              </h2>
                <BadgeShelf
                  catalog={catalog}
                  earnedKeys={earnedKeys}
                  species={pet.species}
                />
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
