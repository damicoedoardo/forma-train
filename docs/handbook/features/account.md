---
type: conceptual
title: Account and cloud backup
description: Sign-in with Supabase, the cloud copy of the save, and how the phone and the cloud agree on which save wins.
tags: [account, supabase, sync, backup]
timestamp: 2026-11-11
---

# Account and cloud backup

Signing in (Supabase: a code by email, or Google) is the app's front door, so the screens
inside can count on it. Once signed in, the app keeps working offline.

- **`gate.ts`**: which screen the app opens on (`door()`): `install` in a browser, `sign-in`
  until signed in (and, right after signing in, until the cloud save has come down, so a
  returning person never sees setup flash), else `app`. No doors in the sandbox; no sign-in when
  the cloud settings are missing (dev). `guideFor()` reads the user agent to pick the install
  steps: iPhone Safari, another iPhone browser, an in-app browser, Android, or a computer.
- **`ui/useDoor.ts`**: feeds `door()` from the phone (standalone display mode, the computer's
  "Use it in this browser" kept in `forma-train-browser-ok`, and the sign-in: `maybeSignedIn()`
  until Supabase answers, then `known` / `met` from the cloud status).
- **`ui/Install.tsx`**: the install screen. Steps light up one after another; Android uses its
  own install prompt when the browser offers one; a computer shows the address to open on the
  phone.
- **`ui/Welcome.tsx`**: the sign-in. It starts as the opening screen's last frame (`IntroMark
  still`, marked `data-intro-stay`) so `Intro` hands over without lifting away, then the mark
  rises and the email code form (Google when on) comes in under it.

- **`cloud.ts`**: the pure sync plan. Given the phone's save, the cloud's and the last rev the
  phone knew, it says: upload, download, ask the person, or nothing.
- **`client.ts`**: the cloud status store, `getCloud` / `putCloud` / `deleteCloud` against
  `/save`, the sign-in calls, and `lastRev` / `rememberRev` (key `forma-train-cloud-rev-v1`).
- **`ui/useCloudStatus.ts`**: the hook screens use to show the backup state (and `userId`).
- **`ui/useCloudSync.ts`**: keeps the cloud copy in step while signed in: meets the cloud on
  sign-in and when the app comes back to the front, sends each change three seconds later, and
  on a clash meets the cloud again. Supabase loads only when this phone may be signed in
  (`maybeSignedIn`) or a sign-in starts (the sign-in calls say `CLOUD_START` on the window).
- **`ui/YouTab.tsx`**: your photo, name and line, your numbers, recent workouts, the account
  (email, backup state, Sign out, which goes back to the sign-in) and Redo setup.

The server keeps one save per person with a `rev`; a write must name the rev it was based on,
so a phone that missed a newer save can never overwrite it (see [the API](../backend/api.md)).
Shared plumbing lives in `src/platform/`: `api.ts` (Supabase client, `api()` fetch with the
token, `Offline`), `analytics.ts` (PostHog, the game's project; off in dev and the sandbox;
`useCloudSync` calls `identify` on sign-in and sign-out), `store.ts` (local save keys `forma-train-v1` and `forma-train-sandbox-v1`)
and `random.ts` (seeded random).

## The sign-in email

Supabase sends the code through Resend (custom SMTP, sender `login@formaquest.app`, set up for
the game and reused). Both the "Magic link or OTP" and "Confirm sign up" templates are
`supabase/templates/sign-in-code.html`, subject "Your Forma code: {{ .Token }}": the code (no
link: a link on an installed iPhone app opens Safari) and a short note from Edoardo. Its header
picture is `public/email/header.png`, the opening screen's last frame, served from
formaquest.app. Supabase keeps its own copy: after changing the file, paste it into both
templates in the dashboard.
