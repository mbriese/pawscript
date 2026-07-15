"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { signUpWithPassword } from "@/app/login/actions";
import type { FormState } from "@/lib/validation";

const inputClass =
  "rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

const RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "At least 12 characters", test: (v) => v.length >= 12 },
  { label: "An uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "A lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "A number", test: (v) => /[0-9]/.test(v) },
  { label: "A symbol", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

function SubmitBtn({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState<FormState, FormData>(
    signUpWithPassword,
    null
  );
  const [password, setPassword] = useState("");
  const allValid = RULES.every((r) => r.test(password));

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
        Email address
      </label>
      <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={inputClass} />

      <label htmlFor="password" className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Create a strong password"
        className={inputClass}
      />

      <ul className="mt-1 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
        {RULES.map((r) => {
          const ok = r.test(password);
          return (
            <li
              key={r.label}
              className={
                ok
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-400"
              }
            >
              {ok ? "✓" : "○"} {r.label}
            </li>
          );
        })}
      </ul>

      <SubmitBtn disabled={!allValid} />

      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
      {state?.message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {state.message}
        </p>
      ) : null}

      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-violet-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
