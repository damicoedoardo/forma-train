---
type: reference
title: The handbook
description: How the handbook stays true: the routing table in the updating-handbook skill, scripts/handbook.mjs lint and check, the pre-push hook and CI, and the Handbook: none escape.
tags: [dev, handbook, docs]
timestamp: 2026-11-02
---

# The handbook

The handbook is only useful while it is true, so a change to the code changes the pages about it
in the same branch.

- **The routing table** (which paths map to which pages) lives in the skill
  `.claude/skills/updating-handbook/SKILL.md`. People, agents and the check read the same table.
- **`node scripts/handbook.mjs lint`**: every page has frontmatter, every link works, every
  folder has an `index.md`, and every file in `src/`, `scripts/`, `public/`, `backend/`,
  `.github/`, `.githooks/`, `.claude/` or a root config has a routing row.
- **`node scripts/handbook.mjs check [base]`**: the pages for what the branch touched were updated.
  A commit line `Handbook: none (<why>)` skips it, for a change that makes no page false.
- **Where it runs**: the pre-push hook (`.githooks/pre-push`, turned on by `pnpm install`), CI
  (`.github/workflows/handbook.yml`), and a session start hook (`.claude/settings.json`) that
  reminds agents to read it first.

The tool and the format come from FORMA's handbook, unchanged.
