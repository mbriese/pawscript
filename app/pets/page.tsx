import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import type { Pet } from "@/lib/types";

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
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Your pets
          </h1>
          <Link
            href="/pets/new"
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            + New pet
          </Link>
        </div>

        {pets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
            <div className="mb-3 text-5xl">🐾</div>
            <p className="text-zinc-500 dark:text-zinc-400">
              No pets yet. Add one to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {pets.map((pet) => (
              <Link
                key={pet.id}
                href={`/pets/${pet.id}`}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-amber-700/60"
              >
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{pet.avatar_emoji}</span>
                  <div>
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {pet.name}
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {pet.breed ? `${pet.breed} · ` : ""}
                      {pet.species}
                    </p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {pet.personality}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
