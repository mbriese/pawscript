# OWASP Security Review Notes

This document summarizes how PawScript was reviewed against OWASP-informed risks, what vulnerabilities were found, and what controls were added to prepare the app for safer use.

## Review Approach

The review focused on the app surfaces where users authenticate, enter data, write records, and cross authorization boundaries:

- Authentication: signup, login, password rules, logout, sessions, and MFA.
- Authorization: what normal users can access or modify, especially admin-only features.
- User input: pet names, task titles, task notes, comments, breed, and personality text.
- Database access: Supabase Row Level Security (RLS), table grants, and service-role-only operations.
- Notifications: email/SMS contact data, phone verification, and delivery logs.
- AI output: generated reports and alerts persisted into the app.

## Vulnerability Found: Broken Access Control

The primary real vulnerability found was an OWASP A01: Broken Access Control issue in the `profiles` table.

The `profiles` table stores a trusted `role` column. The admin system checks this column through `is_admin()` to determine whether a user can access admin-only features. The original migration granted authenticated users update access to `profiles` and added an RLS policy allowing users to update their own profile row.

The issue is that Postgres RLS is row-level, not column-level. The policy correctly limited users to their own row, but it did not prevent a user from changing sensitive columns on that row. A normal authenticated user could theoretically bypass the UI and update their own role through the Supabase REST API:

```text
PATCH /rest/v1/profiles?id=eq.<their-own-user-id>
{ "role": "admin" }
```

If successful, `is_admin()` would return true for that user, granting access to admin capabilities such as listing users, creating users, resetting passwords, and reviewing moderation flags. This is a vertical privilege escalation from regular user to admin.

### Fix

The fix removed authenticated-user write access to `profiles`:

```sql
revoke update on public.profiles from authenticated;
drop policy if exists "profiles_update_self" on public.profiles;
```

Role changes are now server-controlled only. The `role` value is set by the new-user trigger and by privileged service-role code, not by client sessions.

## Related Permissions Finding

A later issue with pet creation revealed the opposite side of Supabase permissions: the core tables had RLS policies, but the initial migration did not grant the base table privileges needed for authenticated users to reach those policies.

Postgres checks table-level privileges before RLS. Without the required `GRANT`s, legitimate app writes to tables like `pets` were denied before the RLS owner policies could run.

This was fixed with `supabase/migrations/0004_grant_core_tables.sql`, which grants the minimum required privileges to `authenticated` and grants service-role access where server-only operations need it. RLS still governs which rows users can access.

## Controls Added

### Access Control

- Sensitive `profiles.role` writes are no longer available to authenticated users.
- User-owned tables are protected by RLS policies keyed to `auth.uid()`.
- Server-only operations use the Supabase service-role key from server code only.
- Phone verification state and OTP fields are only writable by server-side service-role code.

### Injection Protection

- Database access uses the Supabase query builder and parameterized RPCs instead of string-concatenated SQL.
- Server actions validate inputs with Zod before writing to the database.
- Validation covers types, trimming, max lengths, allowed enum values, and UUID format.
- Login throttling was adjusted to avoid raw filter-string construction from request-derived values.

### Authentication Hardening

- Email/password signup and login are supported alongside magic links and Google OAuth.
- Strong passwords are enforced at signup: minimum 12 characters with upper-case, lower-case, number, and symbol requirements.
- Failed login attempts are tracked per email and IP address.
- After 5 failed attempts in a 15-minute window, login is temporarily locked.
- TOTP MFA is available from the account page and enforced at login when a verified factor exists.
- Logout is implemented through `/auth/signout`.
- A client idle watcher signs users out after 30 minutes of inactivity.

### Security Headers

Global HTTP security headers are configured in `next.config.ts`, including:

- Content Security Policy.
- `X-Frame-Options: DENY`.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy`.
- `Permissions-Policy`.
- `Strict-Transport-Security`.

### User Input and Content Moderation

- `lib/moderation.ts` screens user-generated free text with `leo-profanity`.
- Profane pet names, breeds, personality text, task titles, and task notes are rejected before persistence.
- AI-generated alert text is masked before saving to the `alerts` table.

### Secret Handling

- `SUPABASE_SERVICE_ROLE_KEY` is only read in server-side code.
- `OPENAI_API_KEY` is only read in server-side AI generation code.
- The app builds and runs without real Supabase/OpenAI credentials because env access is guarded and AI has local fallback templates.

## Supabase Configuration Items

Some security behavior is managed in Supabase and should be configured in the dashboard for hosted deployments:

- Enable the Google OAuth provider and set callback URLs.
- Enable or tune MFA settings as needed.
- Tune JWT/session expiry.
- Ensure `x-forwarded-for` is forwarded by any proxy/CDN so per-IP login lockout is accurate.
- Enable email confirmations for production onboarding.

## Summary

The review found one high-severity access-control gap: authenticated users could potentially self-promote to admin by updating their own `profiles.role` value through the Supabase API. That path is now closed by revoking profile updates from authenticated users and keeping role changes server-controlled.

The app was also prepared against common OWASP risks with stricter input validation, profanity filtering, login lockout, MFA support, session timeout, security headers, guarded secrets, and explicit database grants that work together with RLS.
