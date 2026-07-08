"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { verifyMfaChallenge } from "@/app/login/actions";
import type { FormState } from "@/lib/validation";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-amber-500 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60"
    >
      {pending ? "Verifying…" : "Verify"}
    </button>
  );
}

export function MfaForm() {
  const [state, action] = useActionState<FormState, FormData>(
    verifyMfaChallenge,
    null
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
        placeholder="123456"
        className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-center text-lg tracking-[0.5em] text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />
      <SubmitBtn />
      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
