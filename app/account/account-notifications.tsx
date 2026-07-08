"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updatePreferences,
  updateNotifyEmail,
  startPhoneVerification,
  verifyPhoneCode,
  sendTestNotification,
  runRemindersNow,
} from "./notification-actions";
import type { FormState } from "@/lib/validation";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_META,
  type NotificationChannel,
  type NotificationLog,
} from "@/lib/types";

export interface NotificationSettings {
  reports: NotificationChannel;
  task_reminders: NotificationChannel;
  alerts: NotificationChannel;
  notifyEmail: string;
  loginEmail: string;
  phone: string;
  phoneVerified: boolean;
  recent: NotificationLog[];
}

const CHANNEL_OPTIONS: { value: NotificationChannel; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "both", label: "Email + SMS" },
];

const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

function Message({ state }: { state: FormState }) {
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

function Btn({
  children,
  pendingLabel,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();
  const base =
    variant === "primary"
      ? "bg-amber-500 text-white hover:bg-amber-600"
      : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-fit rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${base}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function AccountNotifications({ settings }: { settings: NotificationSettings }) {
  const [prefsState, prefsAction] = useActionState<FormState, FormData>(updatePreferences, null);
  const [emailState, emailAction] = useActionState<FormState, FormData>(updateNotifyEmail, null);
  const [phoneState, phoneAction] = useActionState<FormState, FormData>(startPhoneVerification, null);
  const [codeState, codeAction] = useActionState<FormState, FormData>(verifyPhoneCode, null);
  const [testState, testAction] = useActionState<FormState, FormData>(sendTestNotification, null);
  const [remindState, remindAction] = useActionState<FormState, FormData>(runRemindersNow, null);

  return (
    <div className="flex flex-col gap-8">
      <form action={prefsAction} className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Channels by category</h3>
        <div className="flex flex-col gap-3">
          {NOTIFICATION_CATEGORIES.map((cat) => (
            <div key={cat} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  {NOTIFICATION_CATEGORY_META[cat].label}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {NOTIFICATION_CATEGORY_META[cat].description}
                </p>
              </div>
              <select name={cat} defaultValue={settings[cat]} className={inputClass}>
                {CHANNEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <Btn pendingLabel="Saving…">Save preferences</Btn>
        <Message state={prefsState} />
      </form>

      <form action={emailAction} className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Notification email</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Optional. Leave blank to use your login email ({settings.loginEmail || "—"}).
        </p>
        <input
          name="notify_email"
          type="email"
          defaultValue={settings.notifyEmail}
          placeholder={settings.loginEmail || "you@example.com"}
          className={inputClass}
        />
        <Btn pendingLabel="Saving…" variant="secondary">Save email</Btn>
        <Message state={emailState} />
      </form>

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Phone number (SMS)</h3>
          {settings.phoneVerified ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              ✓ verified
            </span>
          ) : settings.phone ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              unverified
            </span>
          ) : null}
        </div>
        <form action={phoneAction} className="flex flex-wrap items-center gap-2">
          <input
            name="phone"
            type="tel"
            defaultValue={settings.phone}
            placeholder="+14155551234"
            className={`${inputClass} flex-1`}
          />
          <Btn pendingLabel="Sending…" variant="secondary">Send code</Btn>
        </form>
        <Message state={phoneState} />

        <form action={codeAction} className="flex flex-wrap items-center gap-2">
          <input
            name="code"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            className={`${inputClass} w-32 text-center tracking-[0.3em]`}
          />
          <Btn pendingLabel="Verifying…" variant="secondary">Verify code</Btn>
        </form>
        <Message state={codeState} />
        <p className="text-xs text-zinc-400">
          Mock mode: SMS is logged server-side and the code is emailed to you (see Mailpit).
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Try it out</h3>
        <div className="flex flex-wrap gap-2">
          <form action={testAction}>
            <Btn pendingLabel="Sending…" variant="secondary">Send test notification</Btn>
          </form>
          <form action={remindAction}>
            <Btn pendingLabel="Running…" variant="secondary">Run reminders now</Btn>
          </form>
        </div>
        <Message state={testState} />
        <Message state={remindState} />
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Recent notifications</h3>
        {settings.recent.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Nothing sent yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                  <th className="px-2 py-2 font-medium">When</th>
                  <th className="px-2 py-2 font-medium">Channel</th>
                  <th className="px-2 py-2 font-medium">Category</th>
                  <th className="px-2 py-2 font-medium">Subject</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {settings.recent.map((n) => (
                  <tr key={n.id} className="border-b border-zinc-100 dark:border-zinc-800/60">
                    <td className="whitespace-nowrap px-2 py-2 text-zinc-500 dark:text-zinc-400">
                      {new Date(n.created_at).toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">{n.channel}</td>
                    <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">{n.category}</td>
                    <td className="px-2 py-2 text-zinc-700 dark:text-zinc-200">{n.subject}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${
                          n.status === "sent"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : n.status === "skipped"
                              ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                              : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                        }`}
                      >
                        {n.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
