---
type: conceptual
title: Account and cloud backup
description: Sign-in with Supabase, the cloud copy of the save, and how the phone and the cloud agree on which save wins.
tags: [account, supabase, sync, backup]
timestamp: 2026-11-02
---

# Account and cloud backup

The app works signed out; signing in (Supabase, Google or email) adds a backup of the save.

- **`cloud.ts`**: the pure sync plan. Given the phone's save, the cloud's and the last rev the
  phone knew, it says: upload, download, ask the person, or nothing.
- **`client.ts`**: the cloud status store, `getCloud` / `putCloud` / `deleteCloud` against
  `/save`, the sign-in calls, and `lastRev` / `rememberRev` (key `forma-train-cloud-rev-v1`).
- **`ui/useCloudStatus.ts`**: the hook screens use to show the backup state.

The server keeps one save per person with a `rev`; a write must name the rev it was based on,
so a phone that missed a newer save can never overwrite it (see [the API](../backend/api.md)).
Shared plumbing lives in `src/platform/`: `api.ts` (Supabase client, `api()` fetch with the
token, `Offline`), `store.ts` (local save keys `forma-train-v1` and `forma-train-sandbox-v1`)
and `random.ts` (seeded random).
