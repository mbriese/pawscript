"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  signInWithGoogle,
  signInWithMagicLink,
  signInWithPassword,
} from "./actions";
import type { FormState } from "@/lib/validation";

const inputClass =
  "rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

function StateMessage({ state }: { state: FormState }) {
  if (!state) return null;
  const text = state.error ?? state.message;
  if (!text) return null;
  return (
    <p
      className={`rounded-lg px-3 py-2 text-sm ${
        state.error
          ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
      }`}
    >
      {text}
    </p>
  );
}

function PrimaryButton({
  children,
  pendingLabel,
}: {
  children: React.ReactNode;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white px-4 py-3 font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
      </svg>
      {pending ? "Redirecting…" : "Continue with Google"}
    </button>
  );
}

export function LoginForm() {
  const [pwState, pwAction] = useActionState<FormState, FormData>(
    signInWithPassword,
    null
  );
  const [linkState, linkAction] = useActionState<FormState, FormData>(
    signInWithMagicLink,
    null
  );

  return (
    <div className="flex flex-col gap-6">
      <form action={pwAction} className="flex flex-col gap-3">
        <label htmlFor="pw-email" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Email &amp; password
        </label>
        <input id="pw-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={inputClass} />
        <input name="password" type="password" required autoComplete="current-password" placeholder="Password" className={inputClass} />
        <PrimaryButton pendingLabel="Signing in…">Sign in</PrimaryButton>
        <StateMessage state={pwState} />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No account?{" "}
          <Link href="/signup" className="font-semibold text-violet-600 hover:underline">
            Create one
          </Link>
        </p>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        <span className="text-xs uppercase tracking-wide text-zinc-400">or</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>

      <form action={linkAction} className="flex flex-col gap-3">
        <input name="email" type="email" required autoComplete="email" placeholder="Email for a magic link" className={inputClass} />
        <button
          type="submit"
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          Send magic link
        </button>
        <StateMessage state={linkState} />
      </form>

      <form action={signInWithGoogle}>
        <GoogleButton />
      </form>
    </div>
  );
}
