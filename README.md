# PawScript

A cloud-backed web app where pet owners log care tasks (for their pets **and** themselves) and the pet narrates everything back in character — dry bureaucratic status reports, nemesis surveillance dispatches, praise, and streak badges. Built for a sub-60-second demo.

## Stack

- **Next.js 16 (App Router) + TypeScript + React 19** — one codebase; all AI calls run server-side so the OpenAI key stays private.
- **Tailwind CSS v4** — playful, modern UI.
- **Supabase** — Postgres + Auth (email magic-link + Google) with Row Level Security so each user only sees their own data.
- **OpenAI** (`gpt-4o-mini`) — generates all pet-voice text. Falls back to templated copy when no key is set.

## Features

- **Task tracker + history** — check off pet/human care needs; completions write `task_logs`, advance `next_due_at`, and power the history timeline and streaks.
- **Pet-voice reports** — instead of "time for meds," the pet writes *"Per my records, the medication protocol has not been executed."* Tone is driven by each pet's personality.
- **Nemesis dispatches** — a "New Dispatch" button generates a random squirrel/mouse/nemesis surveillance report in the pet's voice.
- **Badges + praise** — completing tasks unlocks badges (Mouse Surveillance, Neighborhood Protector, Human Hydration, Human Movement, and consecutive-day streaks) and triggers AI praise.

## Prerequisites

- Node.js 20.9+ (tested on Node 22)
- A free [Supabase](https://supabase.com) project
- (Optional) An [OpenAI API key](https://platform.openai.com) — without it, the app uses templated pet-voice text.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Create a new project at [app.supabase.com](https://app.supabase.com).
2. Grab the values from **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key   # optional
```

### 4. Run the migration

Open **SQL Editor** in the Supabase dashboard and run the contents of:

```
supabase/migrations/0001_init.sql
```

This creates the tables (`pets`, `tasks`, `task_logs`, `alerts`, `badges`, `user_badges`), enables Row Level Security with policies keyed to `auth.uid()`, and seeds the badge catalog.

> Optional: `supabase/seed.sql` inserts a demo pet with tasks (some overdue) — but you must replace the placeholder `user_id` with your own auth UID. The easiest path for the demo is the in-app **"Load demo pet"** button on the dashboard, which populates sample data for the logged-in user automatically.

### 5. Configure Auth providers

- **Email magic-link** works out of the box.
- **Google**: in the Supabase dashboard under **Authentication → Providers → Google**, enable it and add your OAuth credentials.
- Under **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` to the redirect allow-list (and your production callback URL when deploying).

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`. Sign in, click **Load demo pet**, and you're ready for the demo.

## Project structure

```
app/
  page.tsx                 # Dashboard (protected)
  login/                   # Password + magic-link + Google sign-in
  login/mfa/               # TOTP challenge step during login
  signup/                  # Email + password sign-up (strong policy)
  account/                 # MFA enroll/unenroll + session controls
  auth/callback/route.ts   # OAuth / magic-link callback
  auth/signout/route.ts    # Sign-out (clears session)
  pets/                    # /pets, /pets/new, /pets/[id]
  actions/                 # Server actions (pets, tasks, ai)
components/                # UI components (incl. idle-timeout watcher)
lib/
  supabase/                # Browser, server, and admin clients
  ai.ts                    # OpenAI client + prompt builders (server-only)
  badges.ts                # Streak/threshold badge engine
  moderation.ts            # Profanity filter (leo-profanity)
  validation.ts            # Zod schemas (input + password policy)
  rate-limit.ts            # Login lockout (service-role, RLS-protected table)
  types.ts                 # DB row types
  scheduling.ts            # next_due_at helpers
proxy.ts                   # Session refresh (Next.js 16 middleware replacement)
next.config.ts             # Security HTTP headers (CSP, etc.)
supabase/
  migrations/0001_init.sql # Schema + RLS + badge catalog + auth_attempts
  seed.sql                 # Optional demo data
```

## Security

PawScript layers app-level controls on top of Supabase's managed security. Controls marked **(Supabase-managed)** are handled by the platform; the rest are implemented in this app.

### Input validation & injection protection
- Every server action that takes user input (`createPet`, `createTask`, `completeTask`, sign-in/up, MFA) validates with **Zod** — enforcing types, trimming, max lengths, allowed enum values (`subject`, `category`, `frequency`), UUID format for IDs, and a strong-password policy. Invalid input is rejected with friendly messages.
- **SQL injection is prevented** because all database access goes through the Supabase PostgREST query builder and a parameterized RPC (`complete_task`). No user input is ever concatenated into SQL. `.eq()`/`.rpc()` values are URL-encoded/parameterized; the login throttler avoids raw PostgREST `.or()` filter strings to prevent filter injection from spoofed headers.

### Profanity filtering (content moderation)
- `lib/moderation.ts` (leo-profanity) screens **all** user free-text before persisting — pet name, breed, personality, task titles, and task-log notes. On a hit the input is **rejected** with a validation error.
- AI-generated text (reports / nemesis dispatches / praise) is **masked** before being saved to `alerts`.

### Authentication hardening
- **Sign-in methods**: email + password, email magic-link, and Google OAuth.
- **Strong passwords**: enforced on sign-up via Zod — min 12 chars incl. upper, lower, number, and symbol — with live client-side checklist and server-side validation.
- **Login lockout**: failed attempts are recorded in the `auth_attempts` table (per email and per IP). After **5** failures within a **15-minute** window, further attempts are blocked with a cooldown message. The table is written only by the server via the service-role key and has RLS enabled with **no policies**, so no client can read/write it. **(Supabase-managed)** Supabase also applies built-in auth rate limiting.
- **MFA (TOTP)**: enroll from `/account` (scan QR or enter secret, verify a 6-digit code). When a verified factor exists, login requires a second-factor challenge at `/login/mfa` before reaching the app. **(Supabase-managed)** Factor secrets and AAL are stored/enforced by Supabase; enable MFA under **Authentication → settings** if needed.
- **Session timeout**: a client idle watcher signs the user out after **30 minutes** of inactivity (shared across tabs). **(Supabase-managed)** Absolute expiry and refresh-token rotation are governed by Supabase JWT settings (**Authentication → Sessions / JWT expiry**); `proxy.ts` refreshes/validates the session on every request.
- **Logout**: `/auth/signout` calls `supabase.auth.signOut()` to clear the session; a visible **Log out** control is in the header and on `/account`.

### HTTP security headers
Set globally in `next.config.ts`:
- `Content-Security-Policy` (default-src 'self', `connect-src` limited to self + your Supabase origin/websocket, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri`/`form-action 'self'`).
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `Strict-Transport-Security`.

### Secret handling
- `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are only read in server code (server actions / route handlers / server-only modules) and are never exposed to the client.

### Requires Supabase dashboard configuration
- Enable **Google** provider and add the `/auth/callback` redirect URL.
- Optionally tune **JWT expiry / session timeout** and enable **MFA** under Authentication settings.
- For accurate per-IP lockout behind a proxy/CDN, ensure `x-forwarded-for` is forwarded.

## Notifications

PawScript sends email + SMS notifications with per-user preferences. Delivery is **mocked by default** so it works locally with zero external accounts, and swaps to real providers when their env vars are present.

### Categories & preferences
Three categories, each set to `email` | `sms` | `both` | `off` from **/account → Notifications**:
- **Status reports** (`reports`) — fires when a pet status report is generated.
- **Task reminders** (`task_reminders`) — fires for overdue care tasks (default: `email`).
- **Alerts & dispatches** (`alerts`) — fires on nemesis dispatches and praise.

Defaults: `reports=off`, `task_reminders=email`, `alerts=off`. Preferences live in `notification_preferences` (RLS: user-owned).

### Contact info & phone verification
- **Notify email** (optional) overrides the login email; if blank, the login email is used (email is always resolvable).
- **Phone** requires verification: a 6-digit code is generated, "sent" via the notification service (mock: logged as SMS and emailed to Mailpit), and confirmed on `/account`. Contact data (incl. `phone_verified` and the OTP) lives in `user_contacts` and is **only writable by the server** (service role), never the client.
- If a category is `sms`/`both` but no **verified** phone exists, delivery **falls back to email** and the reason is recorded.

### Mock vs. real drivers (`lib/notifications.ts`, server-only)
- **Email** — with no provider env set, mail is delivered to the local **Mailpit** SMTP (`127.0.0.1:54325`) via `nodemailer` and appears at **http://127.0.0.1:54324**. Set `RESEND_API_KEY` (preferred) or `SENDGRID_API_KEY` to send real email; `NOTIFY_FROM` sets the sender.
- **SMS** — a stub that logs to the server console. Set `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` to send real SMS via Twilio.
- **Every attempt** (sent / skipped-because-off / failed / fallback) is written to the `notifications` table, so mock mode is fully visible in-app (recent items on `/account`, all items on `/admin`).

> Enabling the Mailpit SMTP port required uncommenting `smtp_port = 54325` under `[local_smtp]` in `supabase/config.toml` (then `supabase stop && supabase start`).

### Scheduled reminders
- Endpoint: `POST /api/cron/reminders`, protected by `Authorization: Bearer $CRON_SECRET`. It scans all overdue tasks and notifies each owner per their prefs.
- **Idempotency**: `tasks.last_reminded_at` is set after each reminder; a task is only re-notified once `next_due_at` advances past it (i.e. after it's completed and becomes due again), so repeated cron runs don't spam.
- **Local scheduling choice**: the Postgres container can't reach the app's mock SMTP, so DB-driven `pg_cron`→HTTP is impractical locally. Instead:
  - **Demo**: use the **Run reminders now** button on `/account` (runs for the signed-in user).
  - **Real schedule**: run an external cron hitting the endpoint, e.g. a PowerShell scheduled task or a loop:
    ```powershell
    while ($true) {
      curl.exe -s -X POST http://localhost:3000/api/cron/reminders -H "Authorization: Bearer $env:CRON_SECRET"
      Start-Sleep -Seconds 300
    }
    ```
  - `pg_cron`/`pg_net` are enabled (best-effort) by the migration; to drive it from the DB in a hosted setup, schedule a `net.http_post` to your deployed `/api/cron/reminders` URL with the bearer secret.

## Notes

- The OpenAI key is only ever read inside server actions / route handlers. It is never sent to the client.
- The app builds and runs without real Supabase/OpenAI credentials — env access is guarded, AI has a templated fallback, and the login throttler no-ops without the service-role key.
- Next.js 16 renamed `middleware` to `proxy`; session refresh lives in `proxy.ts`.
