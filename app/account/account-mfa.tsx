"use client";

/* eslint-disable @next/next/no-img-element */
import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  enrollMfa,
  unenrollMfa,
  verifyMfaEnrollment,
  type EnrollResult,
} from "./actions";
import type { FormState } from "@/lib/validation";

interface Factor {
  id: string;
  friendlyName: string | null;
  status: string;
}

function VerifyButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
    >
      {pending ? "Verifying…" : "Verify & enable"}
    </button>
  );
}

export function AccountMfa({ verifiedFactors }: { verifiedFactors: Factor[] }) {
  const [enroll, setEnroll] = useState<EnrollResult | null>(null);
  const [starting, startTransition] = useTransition();
  const [verifyState, verifyAction] = useActionState<FormState, FormData>(
    verifyMfaEnrollment,
    null
  );

  const enabled = verifiedFactors.length > 0;

  function startEnroll() {
    startTransition(async () => {
      const result = await enrollMfa();
      setEnroll(result);
    });
  }

  if (enabled) {
    return (
      <div className="flex flex-col gap-4">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          🔐 Two-factor authentication is enabled
        </div>
        {verifiedFactors.map((f) => (
          <form
            key={f.id}
            action={unenrollMfa}
            className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
          >
            <span className="text-sm text-zinc-700 dark:text-zinc-200">
              {f.friendlyName || "Authenticator app"}
            </span>
            <input type="hidden" name="factor_id" value={f.id} />
            <button
              type="submit"
              className="rounded-lg px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              Remove
            </button>
          </form>
        ))}
      </div>
    );
  }

  if (!enroll?.qrCode) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Add a time-based one-time password (TOTP) from an app like Google
          Authenticator, 1Password, or Authy for a second layer of security.
        </p>
        <button
          onClick={startEnroll}
          disabled={starting}
          className="w-fit rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {starting ? "Preparing…" : "Enable two-factor auth"}
        </button>
        {enroll?.error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{enroll.error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Scan this QR code with your authenticator app, then enter the 6-digit
        code to finish.
      </p>
      <img
        src={enroll.qrCode}
        alt="TOTP QR code"
        width={180}
        height={180}
        className="rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700"
      />
      {enroll.secret ? (
        <p className="text-xs text-zinc-400">
          Or enter this secret manually:{" "}
          <code className="font-mono text-zinc-600 dark:text-zinc-300">
            {enroll.secret}
          </code>
        </p>
      ) : null}
      <form action={verifyAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="factor_id" value={enroll.factorId} />
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          placeholder="123456"
          className="w-32 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center tracking-[0.3em] text-zinc-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <VerifyButton />
      </form>
      {verifyState?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          {verifyState.error}
        </p>
      ) : null}
    </div>
  );
}
