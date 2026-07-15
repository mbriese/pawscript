# PawScript Mobile Starter

This is an Expo React Native starter wired to the same Supabase project as the web app.

## Run

From the repository root:

- `npm run dev:web` to run the current Next.js demo.
- `npm run dev:mobile` to start Expo for mobile.

Or directly:

- `cd apps/mobile`
- `npm run start`

## Environment

The app reads:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Use `.env.local.example` as a template. A local `.env.local` is already created for this workspace.

## Included Starter Flow

- Login screen (Supabase email/password)
- Dashboard with active pets, task summary, and dispatch feed
- Pet detail screen
- `🎲 Random Event` button (client-side starter stub that inserts event alerts for the selected pet)
