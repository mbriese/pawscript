import { createAdminClient } from "./supabase/admin";
import { getSupabaseServiceRoleKey } from "./supabase/env";

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

function enabled(): boolean {
  return Boolean(getSupabaseServiceRoleKey());
}

export interface LockoutStatus {
  locked: boolean;
  retryAfterMinutes: number;
}

/**
 * App-level login throttling. Counts failed attempts (per email or IP) within a
 * rolling window and locks further attempts once the threshold is exceeded.
 * Requires the service-role key (writes bypass RLS); no-ops without it so the
 * app still builds/runs without credentials. Supabase also applies its own
 * built-in auth rate limiting on top of this.
 */
export async function checkLockout(
  email: string,
  ip: string
): Promise<LockoutStatus> {
  if (!enabled()) return { locked: false, retryAfterMinutes: 0 };

  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const admin = createAdminClient();

  // Query by email and by IP separately with parameterized `.eq` filters
  // (supabase-js URL-encodes the values) rather than interpolating into a raw
  // PostgREST `.or()` string, which a spoofed header could otherwise abuse.
  const [byEmail, byIp] = await Promise.all([
    admin
      .from("auth_attempts")
      .select("attempted_at")
      .eq("succeeded", false)
      .eq("email", email)
      .gte("attempted_at", since)
      .order("attempted_at", { ascending: true }),
    admin
      .from("auth_attempts")
      .select("attempted_at")
      .eq("succeeded", false)
      .eq("ip", ip)
      .gte("attempted_at", since)
      .order("attempted_at", { ascending: true }),
  ]);

  const rows = [...(byEmail.data ?? []), ...(byIp.data ?? [])];
  const failedCount = Math.max(
    byEmail.data?.length ?? 0,
    byIp.data?.length ?? 0
  );

  if (failedCount >= MAX_FAILED_ATTEMPTS && rows.length > 0) {
    const oldest = Math.min(
      ...rows.map((r) => new Date(r.attempted_at).getTime())
    );
    const unlockAt = oldest + WINDOW_MINUTES * 60_000;
    const retryAfterMinutes = Math.max(
      1,
      Math.ceil((unlockAt - Date.now()) / 60_000)
    );
    return { locked: true, retryAfterMinutes };
  }

  return { locked: false, retryAfterMinutes: 0 };
}

export async function recordAttempt(
  email: string,
  ip: string,
  succeeded: boolean
): Promise<void> {
  if (!enabled()) return;
  const admin = createAdminClient();
  await admin.from("auth_attempts").insert({ email, ip, succeeded });

  // On success, clear the recent failed streak for this email.
  if (succeeded) {
    const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
    await admin
      .from("auth_attempts")
      .delete()
      .eq("email", email)
      .eq("succeeded", false)
      .gte("attempted_at", since);
  }
}

export { MAX_FAILED_ATTEMPTS, WINDOW_MINUTES };
