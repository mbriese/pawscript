import Link from "next/link";
import { IdleTimeout } from "./idle-timeout";

export function SiteHeader({ email }: { email?: string | null }) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/70">
      {email ? <IdleTimeout /> : null}
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50">
          <span className="text-2xl">🐾</span>
          <span className="text-lg tracking-tight">PawScript</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            Dashboard
          </Link>
          <Link
            href="/pets"
            className="rounded-lg px-3 py-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            Pets
          </Link>
          {email ? (
            <>
              <Link
                href="/account"
                className="rounded-lg px-3 py-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                Account
              </Link>
              <form action="/auth/signout" method="post" className="ml-1">
                <button
                  type="submit"
                  className="rounded-lg px-3 py-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                >
                  Log out
                </button>
              </form>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
