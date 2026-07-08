import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { NewPetForm } from "./new-pet-form";

export const metadata = { title: "New pet · PawScript" };
export const dynamic = "force-dynamic";

export default async function NewPetPage() {
  const user = await requireUser();

  return (
    <>
      <SiteHeader email={user.email} />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <Link
          href="/pets"
          className="text-sm text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to pets
        </Link>
        <h1 className="mt-3 mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Add a pet
        </h1>
        <NewPetForm />
      </main>
    </>
  );
}
