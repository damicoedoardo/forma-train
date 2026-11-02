# Forma

A calm, premium training app: an AI coach plans your week from how you really train, logging is
fast, friends cheer you on. Installable PWA, offline first; the save lives on the phone with a
cloud backup (`backend/`). Next.js 16 (App Router), React 18, TypeScript (strict), Tailwind 3,
Vitest, pnpm.

## Handbook (read first, update before pushing)

`docs/handbook/` is the map of this codebase. Start at `docs/handbook/index.md`.

- **Read** the pages for the area you are about to touch before changing it.
- **Search** before deciding something doesn't exist: `rg -i <word> docs/handbook src`.
- **Update before every push (mandatory)**: if your change makes a handbook sentence false or
  incomplete, fix the page in the same branch and bump its `timestamp`. Use the
  `updating-handbook` skill (`.claude/skills/updating-handbook/SKILL.md`): it owns the routing
  table and the page format. Run `pnpm handbook:lint && pnpm handbook:check`. If nothing on the
  pages changed, say so with a `Handbook: none (<why>)` line in a commit message.

## Structure

See `docs/handbook/architecture/structure.md`. In short: `src/app/` routes, `src/ui/` the UI kit,
`src/features/<feature>/` pure rules with `ui/` for its screens, `src/platform/` shared plumbing,
`backend/` the FastAPI server.

## Conventions

- **Rules are pure** and take `now: Date` or a seed. No React or DOM outside `ui/` folders,
  `src/ui/` and `src/app/`.
- **Features talk through their rules**, never through each other's `ui/`.
- **One save**: every change goes through the store's `update(fn)`. New save fields are optional
  or come with a `migrate()` step; a live save must always load.
- **The look** (`docs/handbook/ui/look.md`): tokens from `tailwind.config.ts`, surfaces from
  `src/ui/`. Restraint: one primary button a screen, medium weights, little text, one accent.
- TypeScript strict, no `any`. Path alias `@/` is `src/`. Icons: `lucide-react`.
- Comments and UI copy in plain, short words.
- Change only what was asked. Don't remove or redesign things nobody asked about.
