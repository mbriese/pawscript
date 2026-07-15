import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { NewPetForm } from "./new/new-pet-form";
import type { Pet } from "@/lib/types";
import { speciesLabel } from "@/lib/species";

export const metadata = { title: "Pets · PawScript" };
export const dynamic = "force-dynamic";

export default async function PetsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("pets")
    .select("*")
    .order("created_at", { ascending: true });
  const pets = (data ?? []) as Pet[];

  return (
    <>
      <SiteHeader email={user.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
              PawScript roster
            </p>
            <h1 className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Select a Pet
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
              Choose the pet whose dispatches, tasks, and reports you want to manage.
            </p>
          </div>
          <Link
            href="#add-launch-character"
            className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-600"
          >
            + Add launch character
          </Link>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Selected pets
          </h2>
          {pets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
            <div className="mb-3 text-5xl">🐾</div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              No pets selected yet
            </h2>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">
              Choose one of the launch characters below to get started.
            </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pets.map((pet) => (
                <Link
                  key={pet.id}
                  href={`/pets/${pet.id}`}
                  className="group flex min-h-72 flex-col rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-700/60"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-100 to-fuchsia-100 text-5xl shadow-inner dark:from-violet-950/50 dark:to-fuchsia-950/40"
                      aria-hidden
                    >
                      {pet.avatar_emoji}
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {pet.name}
                      </h2>
                      <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        {pet.breed ? `${pet.breed} • ` : ""}
                        {speciesLabel(pet.species)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-5 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    {pet.personality}
                  </p>
                  {pet.nemesis || pet.quirks ? (
                    <div className="mt-4 space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {pet.nemesis ? (
                        <p>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                            Nemesis:
                          </span>{" "}
                          {pet.nemesis}
                        </p>
                      ) : null}
                      {pet.quirks ? (
                        <p>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                            Quirks:
                          </span>{" "}
                          {pet.quirks}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <span className="mt-5 inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-violet-500 dark:bg-zinc-100 dark:text-zinc-900 dark:group-hover:bg-violet-400">
                    Select {pet.avatar_emoji}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section id="add-launch-character" className="mt-10 scroll-mt-24">
          <NewPetForm />
        </section>
      </main>
    </>
  );
}
