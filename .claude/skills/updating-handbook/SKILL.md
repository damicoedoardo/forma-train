---
name: updating-handbook
description: Use BEFORE every push in this repo — check whether docs/handbook/ pages covering the touched paths need updating (routing table inside; the pre-push hook and CI enforce it). Also use when asked to "update the handbook/wiki", add a handbook page, or document a part of the code. Owns the handbook's format rules and the path→page routing table.
---

# Updating the handbook

`docs/handbook/` is the map of Forma that every agent reads before working. It stays useful only
if every change that makes a page false also fixes the page, in the same branch, before the push.
`scripts/handbook.mjs` enforces it: the git pre-push hook and CI run `lint` and `check`.

## Before every push

1. See what the branch touched: `git diff --name-only origin/main...HEAD`
2. Look up every touched path in the routing table below.
3. For each mapped page: read it; if your change makes any sentence false or incomplete (a file
   moved, a rule changed, a new screen, a new command), fix the page and bump its `timestamp`.
4. If a page's `timestamp` is older than about a month, check the whole page against the code.
5. Run `pnpm handbook:lint && pnpm handbook:check`; both must say OK.
6. Nothing on the page changed? Add a line `Handbook: none (<why>)` to your commit message
   instead. Use it honestly: it skips the check for the whole branch.

## Routing table (touched path → pages to check)

Paths are globs from the repo root; pages are under `docs/handbook/`. The check reads this table,
so keep every path and page in backticks, one row per line. `pnpm handbook:lint` fails when a
file in `src/`, `scripts/`, `public/`, `backend/`, `.github/`, `.githooks/`, `.claude/` or a root
config has no row: give a new folder its row (and a page if no page fits).

| You touched | Check / update |
|---|---|
| `src/app/**` | `architecture/structure.md`, `product/overview.md` |
| `src/ui/**`, `tailwind.config.ts`, `postcss.config.js` | `ui/look.md` |
| `src/platform/**` | `architecture/structure.md`, `features/account.md` |
| `src/features/training/**` | `features/training.md` |
| `src/features/coach/**` | `features/coach.md` |
| `src/features/exercises/**` | `features/exercises.md` |
| `src/features/account/**` | `features/account.md` |
| `backend/app/coach.py` | `features/coach.md`, `backend/api.md` |
| `backend/**` | `backend/api.md` |
| `public/**` | `architecture/structure.md` |
| `package.json`, `tsconfig.json`, `vitest.config.ts`, `next.config.ts`, `.github/workflows/app.yml`, `.github/workflows/backend.yml` | `dev/workflow.md` |
| `scripts/handbook.mjs`, `.githooks/**`, `.github/workflows/handbook.yml`, `.claude/**` | `dev/handbook.md` |

Also update `product/overview.md` for any change a user would notice, and
`architecture/structure.md` for a new top-level folder, a new feature folder or a new import rule.

## Page format

Every page starts with:

    ---
    type: conceptual | reference | landing
    title: Short name
    description: One line — agents scan these without reading the page.
    tags: [area, subarea]
    timestamp: YYYY-MM-DD   # bump when you verify or edit the page
    ---

- One concept per file; the path is its identity. About one to three screens; split rather than grow.
- An `index.md` per folder, `type: landing`, navigation only.
- Relative links between pages; code paths in backticks from the repo root.
- Write what IS, in plain words. Where code is half-moved or messy, say so.
- Keep the "I want to... → Edit" tables: they are the most used part.

## Link, never restate

`AGENTS.md` (conventions), the code's own constants and this skill stay the authority; link to
them, don't copy them into pages.

## Adding a page

1. Create it in the right folder with the frontmatter above.
2. Link it from that folder's `index.md` (and `docs/handbook/index.md` for a new folder).
3. Add or extend a routing row above so future changes find it.
4. `pnpm handbook:lint`.
