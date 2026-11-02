---
type: conceptual
title: Training
description: The TrainingState save, how a workout is drafted, logged and finished, rest days, the week streak and the training numbers.
tags: [training, save, session, workout]
timestamp: 2026-11-02
---

# Training

`src/features/training/` owns the save and the workout itself.

- **`session.ts`**: `TrainingState` (version 1), the one save on the phone. It holds the
  profile (`onboarded`, `name`, `kit`), best reps per move, finished `sessions`, the open
  `draft`, the coach's state (`coach`) and the days kept as rest (`rested`, ISO dates).
  `todaysWorkout` reads today's plan from the coach's week, falling back to the built-in
  program. `finishSession` turns the draft into a `Session` and returns the new state.
  `closeStaleDraft` closes a draft left open past `STALE_DRAFT_HOURS`. `weekStreak` and
  `sessionsThisWeek` count against `WEEKLY_GOAL`. `migrate` upgrades older saves.
- **`program.ts`**: the built-in plan, used before the coach has planned a week.
- **`days.ts`**: date helpers (local day keys, weekdays).
- **`config.ts`**: the numbers: `WEEKLY_GOAL` 3, `REST_SECONDS` 90, `MAX_RAISES_PER_WEEK` 2,
  `MAX_WORKOUT_MINUTES` 180, `STALE_DRAFT_HOURS` 12.
- **`ui/useTraining.ts`**: the React hook that loads the save, writes every change through
  `@/platform/store`, and hands screens `update(fn)`.

A session has no XP and no game rewards: it is the log the coach reads.
