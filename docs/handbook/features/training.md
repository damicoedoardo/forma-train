---
type: conceptual
title: Training
description: The TrainingState save, how a workout is drafted, logged and finished, rest days, the week streak and the training numbers.
tags: [training, save, session, workout]
timestamp: 2026-11-11
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
- **`workout.ts`**: the workout under way: `startWorkout`, `logSet` (and the rest clock in
  `draft.restUntil`), `undoSet`, `currentIndex` (the exercise to do now; warm-ups and stretches
  are one tap), `lastTime`, `beatsBest` (a set over last time's best and over every set today),
  `setCount`, and the short texts (`clockText`, `doseText`). `FEEL`
  names how a set felt: Easy, Right, Hard (reps in reserve 4+, 2-3, 0-1).
- **`ui/Today.tsx`**: the Forma mark and a small badge with the workouts done, then the hero card (the date, the workout's title, the week
  as a ring, workouts done of planned, `weekRing`, and as seven dots), the workout's list
  (warm-up and cool-down as one line each; each move plays our own animation of it,
  `BodyDemo`, and opens its page on a tap), the coach's line, and Start / Continue / Mark rested.
- **`ui/BodyDemo.tsx`**: plays an exercise's anatomy animation (`features/exercises/anatomy`)
  in the rich look at about 30 fps: it defines the gradients and blurs under its own ids and
  layers the shadow, the ghost, the body and the glow. `small` (Today's rows) leaves out the
  blurs; `bare` drops the tile behind the body. A quiet dumbbell tile when the move has none.
- **`ui/ExercisePage.tsx`**: one exercise, opened from Today: the video on top, the animation
  with the muscles it works, then Do and
  Avoid (`guideFor` in `features/exercises/guide.ts`). It covers the screen; the phone's back
  closes it.
- **`ui/Workout.tsx`**: one exercise at a time: our animation of it, large and with no tile
  behind it (`BodyDemo bare`, as tall as the phone allows) with a "How to" chip on its corner
  (either opens `ExercisePage`; with no animation the chip sits under the name), its
  name, the sets as short bars, the counter in a glass row with − and +, how it felt, Log set, then the rest
  clock (with the next exercise and its small animation), which buzzes and chimes when it runs out (not when skipped). A set that beats your best
  shows "New best" over the rest clock. The screen stays on (`useWakeLock`). A friend's cheer
  shows on top. The close button offers finish now, pause, or drop. The
  last set finishes the workout.
- **`ui/After.tsx`**: time, sets, records, the week, what went up, how it felt, Share.
- **`ui/useTraining.ts`**: the React hook that loads the save, writes every change through
  `@/platform/store`, and hands screens `update(fn)`.

A session has no XP and no game rewards: it is the log the coach reads.
