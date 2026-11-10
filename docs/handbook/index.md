---
type: landing
title: Forma Handbook
description: The map of the Forma codebase, the single entry point for every agent and engineer before they touch the code.
tags: [handbook, navigation]
timestamp: 2026-11-02
---

# Forma Handbook

`docs/handbook/` is the map of Forma: what the app is, how the code is laid out, how each part
works, and where to change what. One concept per file, an `index.md` per folder, relative links.

**Every agent reads this before working**, and **every change updates it before pushing**. The
pre-push hook and CI refuse a branch whose code changed under a page that didn't (see
[dev/handbook.md](dev/handbook.md)).

## First read

1. [Product overview](product/overview.md): what Forma is and where it came from
2. [Code structure](architecture/structure.md): the folders, the features, the import rules
3. [The look](ui/look.md): the dark glass design and the UI kit
4. [Workflow](dev/workflow.md): commands, branches, deploys

## Page map

- [Product](product/index.md)
- [Architecture](architecture/index.md)
- [UI](ui/index.md)
- [Features](features/index.md)
- [Backend](backend/index.md)
- [Dev](dev/index.md)

For how we work, the authority is [`AGENTS.md`](../../AGENTS.md). Link to it; don't copy it here.
