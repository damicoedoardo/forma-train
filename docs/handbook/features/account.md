---
type: conceptual
title: Account and cloud backup
description: Sign-in with Supabase, the cloud copy of the save, and how the phone and the cloud agree on which save wins.
tags: [account, supabase, sync, backup]
timestamp: 2026-11-11
---

# Account and cloud backup

The app works signed out; signing in (Supabase, Google or email) adds a backup of the save.

- **`cloud.ts`**: the pure sync plan. Given the phone's save, the cloud's and the last rev the
  phone knew, it says: upload, download, ask the person, or nothing.
- **`client.ts`**: the cloud status store, `getCloud` / `putCloud` / `deleteCloud` against
  `/save`, the sign-in calls, and `lastRev` / `rememberRev` (key `forma-train-cloud-rev-v1`).
- **`ui/useCloudStatus.ts`**: the hook screens use to show the backup state (and `userId`).
- **`ui/useCloudSync.ts`**: keeps the cloud copy in step while signed in: meets the cloud on
  sign-in and when the app comes back to the front, sends each change three seconds later, and
  on a clash meets the cloud again. Supabase loads only when this phone may be signed in
  (`maybeSignedIn`) or a sign-in starts (the sign-in calls say `CLOUD_START` on the window).
- **`ui/YouTab.tsx`**: your photo, name and line, your numbers, recent workouts, the sign-in
  (email code, Google when on) and backup state, and Redo setup.

The server keeps one save per person with a `rev`; a write must name the rev it was based on,
so a phone that missed a newer save can never overwrite it (see [the API](../backend/api.md)).
Shared plumbing lives in `src/platform/`: `api.ts` (Supabase client, `api()` fetch with the
token, `Offline`), `analytics.ts` (PostHog, the game's project; off in dev and the sandbox;
`useCloudSync` calls `identify` on sign-in and sign-out), `store.ts` (local save keys `forma-train-v1` and `forma-train-sandbox-v1`)
and `random.ts` (seeded random).
