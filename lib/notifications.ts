import "server-only";

import nodemailer from "nodemailer";
import { createAdminClient } from "./supabase/admin";
import { getSupabaseServiceRoleKey } from "./supabase/env";
import type {
  NotificationCategory,
  NotificationChannel,
  NotificationDeliveryChannel,
  NotificationStatus,
} from "./types";

type Admin = ReturnType<typeof createAdminClient>;

interface DeliveryResult {
  status: NotificationStatus;
  detail: string;
}

const DEFAULT_FROM = "PawScript <no-reply@pawscript.local>";

// Drivers ---------------------------------------------------------------------
// Each driver prefers a real provider when its env vars are present, and falls
// back to a local mock (Mailpit SMTP for email, console log for SMS). Env access
// is fully guarded so builds need no credentials.

async function deliverEmail(
  to: string | null,
  subject: string,
  body: string
): Promise<DeliveryResult> {
  if (!to) return { status: "failed", detail: "No email address on file." };

  const from = process.env.NOTIFY_FROM || DEFAULT_FROM;

  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, text: body }),
      });
      return res.ok
        ? { status: "sent", detail: "Sent via Resend." }
        : { status: "failed", detail: `Resend responded ${res.status}.` };
    }

    const sendgridKey = process.env.SENDGRID_API_KEY;
    if (sendgridKey) {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from },
          subject,
          content: [{ type: "text/plain", value: body }],
        }),
      });
      return res.ok
        ? { status: "sent", detail: "Sent via SendGrid." }
        : { status: "failed", detail: `SendGrid responded ${res.status}.` };
    }

    // Mock: deliver to the local Mailpit SMTP so it shows in the mail UI.
    const host = process.env.MOCK_SMTP_HOST || "127.0.0.1";
    const port = Number(process.env.MOCK_SMTP_PORT || "54325");
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: false,
      tls: { rejectUnauthorized: false },
    });
    await transport.sendMail({ from, to, subject, text: body });
    return {
      status: "sent",
      detail: `Mock email delivered to Mailpit (${host}:${port}).`,
    };
  } catch (e) {
    return {
      status: "failed",
      detail: `Email delivery failed: ${(e as Error).message}`,
    };
  }
}

async function deliverSms(
  to: string | null,
  subject: string,
  body: string
): Promise<DeliveryResult> {
  if (!to) return { status: "failed", detail: "No phone number on file." };

  const text = subject ? `${subject}: ${body}` : body;

  try {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM;
    if (sid && token && from) {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization:
              "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: to, From: from, Body: text }),
        }
      );
      return res.ok
        ? { status: "sent", detail: "Sent via Twilio." }
        : { status: "failed", detail: `Twilio responded ${res.status}.` };
    }

    console.log(`[SMS MOCK] to=${to} :: ${text}`);
    return { status: "sent", detail: "Mock SMS logged to the server console." };
  } catch (e) {
    return {
      status: "failed",
      detail: `SMS delivery failed: ${(e as Error).message}`,
    };
  }
}

// Data helpers ----------------------------------------------------------------

interface ResolvedPrefs {
  reports: NotificationChannel;
  task_reminders: NotificationChannel;
  alerts: NotificationChannel;
}

async function loadPrefs(admin: Admin, userId: string): Promise<ResolvedPrefs> {
  const { data } = await admin
    .from("notification_preferences")
    .select("reports, task_reminders, alerts")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    reports: (data?.reports as NotificationChannel) ?? "off",
    task_reminders: (data?.task_reminders as NotificationChannel) ?? "email",
    alerts: (data?.alerts as NotificationChannel) ?? "off",
  };
}

interface ResolvedContact {
  notifyEmail: string | null;
  phone: string | null;
  phoneVerified: boolean;
  loginEmail: string | null;
}

async function loadContact(
  admin: Admin,
  userId: string
): Promise<ResolvedContact> {
  const { data } = await admin
    .from("user_contacts")
    .select("notify_email, phone, phone_verified")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: userData } = await admin.auth.admin.getUserById(userId);

  return {
    notifyEmail: (data?.notify_email as string | null) ?? null,
    phone: (data?.phone as string | null) ?? null,
    phoneVerified: Boolean(data?.phone_verified),
    loginEmail: userData?.user?.email ?? null,
  };
}

interface RecordArgs {
  userId: string;
  channel: NotificationDeliveryChannel;
  category: string;
  to: string | null;
  subject: string;
  body: string;
  status: NotificationStatus;
  detail: string;
}

async function record(admin: Admin, args: RecordArgs): Promise<void> {
  await admin.from("notifications").insert({
    user_id: args.userId,
    channel: args.channel,
    category: args.category,
    to_address: args.to,
    subject: args.subject.slice(0, 300),
    body: args.body.slice(0, 4000),
    status: args.status,
    detail: args.detail.slice(0, 500),
  });
}

// Public API ------------------------------------------------------------------

export interface SendNotificationInput {
  userId: string;
  category: NotificationCategory;
  subject: string;
  body: string;
}

/**
 * Resolves the user's channel preference + contact info for a category and
 * dispatches accordingly, recording every attempt (including off/skipped and
 * SMS-without-verified-phone fallbacks). Never throws into the caller.
 */
export async function sendNotification(
  input: SendNotificationInput
): Promise<void> {
  if (!getSupabaseServiceRoleKey()) return;

  try {
    const admin = createAdminClient();
    const prefs = await loadPrefs(admin, input.userId);
    const channel = prefs[input.category];
    const contact = await loadContact(admin, input.userId);
    const email = contact.notifyEmail || contact.loginEmail;

    if (channel === "off") {
      await record(admin, {
        userId: input.userId,
        channel: "email",
        category: input.category,
        to: email,
        subject: input.subject,
        body: input.body,
        status: "skipped",
        detail: `'${input.category}' notifications are turned off.`,
      });
      return;
    }

    const wantEmail = channel === "email" || channel === "both";
    const wantSms = channel === "sms" || channel === "both";

    if (wantEmail) {
      const r = await deliverEmail(email, input.subject, input.body);
      await record(admin, {
        userId: input.userId,
        channel: "email",
        category: input.category,
        to: email,
        subject: input.subject,
        body: input.body,
        status: r.status,
        detail: r.detail,
      });
    }

    if (wantSms) {
      if (contact.phone && contact.phoneVerified) {
        const r = await deliverSms(contact.phone, input.subject, input.body);
        await record(admin, {
          userId: input.userId,
          channel: "sms",
          category: input.category,
          to: contact.phone,
          subject: input.subject,
          body: input.body,
          status: r.status,
          detail: r.detail,
        });
      } else if (wantEmail) {
        await record(admin, {
          userId: input.userId,
          channel: "sms",
          category: input.category,
          to: contact.phone,
          subject: input.subject,
          body: input.body,
          status: "skipped",
          detail: "No verified phone; already covered by email above.",
        });
      } else {
        const r = await deliverEmail(email, input.subject, input.body);
        await record(admin, {
          userId: input.userId,
          channel: "email",
          category: input.category,
          to: email,
          subject: input.subject,
          body: input.body,
          status: r.status,
          detail: `No verified phone; fell back to email. ${r.detail}`.trim(),
        });
      }
    }
  } catch {
    // Notifications must never break the triggering action.
  }
}

/**
 * Sends an email directly regardless of category prefs. Used for the "send test
 * notification" action and phone-verification codes so they are always visible.
 */
export async function sendDirectEmail(
  userId: string,
  subject: string,
  body: string,
  category = "test"
): Promise<DeliveryResult> {
  if (!getSupabaseServiceRoleKey()) {
    return { status: "failed", detail: "Service role key not configured." };
  }
  const admin = createAdminClient();
  const contact = await loadContact(admin, userId);
  const email = contact.notifyEmail || contact.loginEmail;
  const result = await deliverEmail(email, subject, body);
  await record(admin, {
    userId,
    channel: "email",
    category,
    to: email,
    subject,
    body,
    status: result.status,
    detail: result.detail,
  });
  return result;
}

// Task reminders --------------------------------------------------------------

interface DueTask {
  id: string;
  title: string;
  next_due_at: string;
  last_reminded_at: string | null;
}

function overdueNeedingReminder(tasks: DueTask[]): DueTask[] {
  // A task is only re-reminded once its next_due_at has advanced past the last
  // reminder (i.e. after it was completed and became due again).
  return tasks.filter(
    (t) => !t.last_reminded_at || t.last_reminded_at < t.next_due_at
  );
}

function reminderMessage(titles: string[]): { subject: string; body: string } {
  const list = titles.join(", ");
  return {
    subject: `PawScript: ${titles.length} care task${
      titles.length === 1 ? "" : "s"
    } overdue`,
    body: `Per my records, the following care task${
      titles.length === 1 ? " remains" : "s remain"
    } outstanding: ${list}. Your attention is requested.`,
  };
}

/** Runs reminders for a single user's overdue tasks. Returns count reminded. */
export async function runRemindersForUser(
  userId: string
): Promise<{ reminded: number }> {
  if (!getSupabaseServiceRoleKey()) return { reminded: 0 };
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data } = await admin
    .from("tasks")
    .select("id, title, next_due_at, last_reminded_at")
    .eq("user_id", userId)
    .lte("next_due_at", nowIso);

  const due = overdueNeedingReminder((data ?? []) as DueTask[]);
  if (due.length === 0) return { reminded: 0 };

  const { subject, body } = reminderMessage(due.map((t) => t.title));
  await sendNotification({ userId, category: "task_reminders", subject, body });

  await admin
    .from("tasks")
    .update({ last_reminded_at: nowIso })
    .in(
      "id",
      due.map((t) => t.id)
    );

  return { reminded: due.length };
}

/** Runs reminders across all users. Used by the scheduled cron endpoint. */
export async function runRemindersForAllUsers(): Promise<{
  users: number;
  tasks: number;
}> {
  if (!getSupabaseServiceRoleKey()) return { users: 0, tasks: 0 };
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data } = await admin
    .from("tasks")
    .select("id, user_id, title, next_due_at, last_reminded_at")
    .lte("next_due_at", nowIso);

  const rows = (data ?? []) as (DueTask & { user_id: string })[];
  const due = overdueNeedingReminder(rows) as (DueTask & { user_id: string })[];
  if (due.length === 0) return { users: 0, tasks: 0 };

  const byUser = new Map<string, DueTask[]>();
  for (const t of due) {
    const list = byUser.get(t.user_id) ?? [];
    list.push(t);
    byUser.set(t.user_id, list);
  }

  for (const [userId, tasks] of byUser) {
    const { subject, body } = reminderMessage(tasks.map((t) => t.title));
    await sendNotification({ userId, category: "task_reminders", subject, body });
    await admin
      .from("tasks")
      .update({ last_reminded_at: nowIso })
      .in(
        "id",
        tasks.map((t) => t.id)
      );
  }

  return { users: byUser.size, tasks: due.length };
}
