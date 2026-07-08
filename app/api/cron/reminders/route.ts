import { NextResponse, type NextRequest } from "next/server";
import { runRemindersForAllUsers } from "@/lib/notifications";

// nodemailer (mock email driver) needs the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scheduled task-reminder sweep. Protected by a bearer CRON_SECRET. Scans all
 * overdue tasks and sends each owner a task_reminders notification, respecting
 * their preferences. Idempotent: tasks.last_reminded_at prevents re-notifying
 * the same overdue cycle.
 */
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 }
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await runRemindersForAllUsers();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function GET(request: NextRequest) {
  return handle(request);
}
