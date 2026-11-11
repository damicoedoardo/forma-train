---
type: reference
title: Workflow
description: The commands (dev, test, typecheck, build, handbook), branches and PRs, and how Forma deploys.
tags: [dev, workflow, git]
timestamp: 2026-11-11
---

# Workflow

| Command | What |
|---|---|
| `pnpm install` | Install, and turn on the git hooks (`.githooks/`) |
| `pnpm dev` | The app at http://localhost:3000 |
| `pnpm test` | Vitest, every `*.test.ts` |
| `pnpm typecheck` | TypeScript, no emit |
| `pnpm build` | The production build |
| `pnpm handbook:lint && pnpm handbook:check` | The handbook guard ([handbook.md](handbook.md)) |

- Work on a branch, open a PR into `main`. CI runs typecheck, tests and the build (`.github/workflows/app.yml`), the backend lint and tests when `backend/` changes (`.github/workflows/backend.yml`), and the handbook guard (`.github/workflows/handbook.yml`). CI runs on every PR, stacked ones too.
- Deploys: the app goes on Vercel (project `forma-train`) from `main`. `vercel.json` names one
  service, the Next.js app, so Vercel does not try to run `backend/` too; the FastAPI backend
  runs on our server (see [the API](../backend/api.md)). Production is `https://formaquest.app`
  (also `forma-train-one.vercel.app`). Vercel settings: `NEXT_PUBLIC_API_URL`,
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_POSTHOG_KEY` and
  `DEEPGRAM_API_KEY`. `NEXT_PUBLIC_` values are baked in at build time, so a change needs a
  new deploy.
- App updates: an installed app checks for a new deploy each time it is brought back
  (`src/platform/pwa/ServiceWorker.tsx`) and reloads into it, right away if untouched, else once
  hidden. The build name (`NEXT_PUBLIC_BUILD_ID` in `next.config.ts`) is a hash of the app's own
  files (`src/`, `public/`, the configs and lockfile), not the commit, so a deploy that changes only
  `backend/` or `docs/` keeps every file name the same and no open app reloads.
- `src/platform/pwa/ViewportHeal.tsx` re-measures the screen after the iPhone keyboard closes. It
  hides the page for one layout, which restarts every CSS animation, so it only runs after a field
  or the keyboard was really up, never on a plain open.
