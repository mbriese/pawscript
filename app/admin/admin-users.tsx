"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createUserAction, updatePasswordAction } from "./actions";
import type { FormState } from "@/lib/validation";

export interface AdminUser {
  id: string;
  email: string | null;
  createdAt: string | null;
  role: string;
  mfa: boolean;
}

const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

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

function Pending({ children, pendingLabel }: { children: React.ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

function AddUserForm() {
  const [state, action] = useActionState<FormState, FormData>(createUserAction, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input name="email" type="email" required autoComplete="off" placeholder="new.user@example.com" className={inputClass} />
        <input
          name="password"
          type="text"
          required
          autoComplete="off"
          placeholder="Temp password (12+ chars, mixed)"
          className={inputClass}
        />
        <Pending pendingLabel="Adding…">Add user</Pending>
      </div>
      <StateMessage state={state} />
    </form>
  );
}

function UpdatePasswordForm({ userId }: { userId: string }) {
  const [state, action] = useActionState<FormState, FormData>(updatePasswordAction, null);
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="user_id" value={userId} />
        <input
          name="password"
          type="text"
          required
          autoComplete="off"
          placeholder="New password"
          className={`${inputClass} min-w-[12rem] flex-1`}
        />
        <Pending pendingLabel="Saving…">Reset password</Pending>
      </div>
      <StateMessage state={state} />
    </form>
  );
}

export function AdminUsers({ users }: { users: AdminUser[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200">Add a user</h3>
        <AddUserForm />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
              <th className="px-2 py-2 font-medium">Email</th>
              <th className="px-2 py-2 font-medium">Role</th>
              <th className="px-2 py-2 font-medium">MFA</th>
              <th className="px-2 py-2 font-medium">Created</th>
              <th className="px-2 py-2 font-medium">Update password</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-zinc-100 align-top dark:border-zinc-800/60">
                <td className="px-2 py-3 font-medium text-zinc-800 dark:text-zinc-100">
                  {u.email ?? "—"}
                </td>
                <td className="px-2 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.role === "admin"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-2 py-3 text-zinc-500 dark:text-zinc-400">
                  {u.mfa ? "✓ on" : "—"}
                </td>
                <td className="px-2 py-3 text-zinc-500 dark:text-zinc-400">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-2 py-3">
                  <UpdatePasswordForm userId={u.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
