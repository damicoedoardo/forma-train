---
type: conceptual
title: Code structure
description: The folders of Forma — app routes, the UI kit, one folder per feature with pure rules and their screens, shared platform code, the backend — and the import rules between them.
tags: [architecture, structure, layers]
timestamp: 2026-11-11
---

# Code structure

Next.js 16 (App Router), React 18, TypeScript strict, Tailwind 3, Vitest, pnpm. One page holds
the app (`src/app/page.tsx`); the save lives on the phone, with a cloud backup once signed in.

```
src/app/         Routes: the app (page.tsx), layout, manifest, globals.css, api/voice (dictation)
src/ui/          The UI kit: Glass, Button, Segmented, Glow, TabBar, Screen, Stats, Avatar, Chip, Intro (the opening screen), Silk, Weave
src/features/    One folder per feature (training, coach, exercises, social, account)
  <feature>/     Pure rules and types (*.ts), tested next to them (*.test.ts)
  <feature>/ui/  That feature's screens and hooks (React)
src/platform/    Shared plumbing: the store, the api client, random, the ticking clock (useNow), the screen wake lock (useWakeLock), the chime, pwa/ (the service worker and update check, and the fix for the iPhone keyboard)
backend/         FastAPI on our server: login check, backup, coach relay, social
scripts/         Node tools: the handbook check
public/          Service worker and icons (weave-*.png; the manifest is src/app/manifest.ts)
docs/handbook/   This handbook
```

## Import rules

```
app/ ─► features/*/ui ─► features/* ─► platform/
            │                 ▲
            └──► ui/          └── other features' rules (never their ui/)
```

- **Rules are pure.** Nothing outside a `ui/` folder (or `src/app`, `src/ui`) imports React or
  touches the DOM. Rules take `now: Date` or a seed, so tests and replays are exact.
- **A feature's public face is its rules.** Another feature may import its pure files, never its
  `ui/`. Screens compose in `src/app/page.tsx`.
- **The UI kit has no feature knowledge.** It takes props; it never imports from `features/`.
- Path alias `@/` is `src/`.

## Why this shape

FORMA kept rules in `src/lib/` and every screen in one `src/components/` folder, and the coach
ended up importing the story, the sprites and the game save. Feature folders keep each part's
rules, screens and tests together, and the import rules keep them from tangling again.
