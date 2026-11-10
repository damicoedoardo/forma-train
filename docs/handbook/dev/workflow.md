---
type: reference
title: Workflow
description: The commands (dev, test, typecheck, build, handbook), branches and PRs, and how Forma deploys.
tags: [dev, workflow, git]
timestamp: 2026-11-10
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
  goes on our server.
