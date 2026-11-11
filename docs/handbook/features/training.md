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
- **`ui/Today.tsx`**: the Forma mark and a small badge with the workouts done, then the hero card: the date, the workout's title, the week
  as a ring (workouts done of planned, `weekRing`), a ribbon of light drifting through the card
  (`Silk`, slower on a rest or done day), and the week as seven days. Each day is a tap: the hero and the list show that day's
  workout (`planWorkout`), a soft pill marks the day on show, and "Back to today" (or today's
  dot) returns. Then the coach's line, the
  workout's list (warm-up and cool-down as one line each; each move plays its animation; a tap
  opens its page), and Start / Continue / Mark rested, right after the list (not pinned).
- **`ui/BodyDemo.tsx`**: plays an exercise's anatomy animation (`features/exercises/anatomy`)
  in the rich look at about 30 fps: it defines the gradients and blurs under its own ids and
  layers the shadow, the ghost, the body and the glow. `small` (Today's rows) leaves out the
  blurs; `bare` drops the tile behind the body. A quiet dumbbell tile when the move has none.
- **`ui/ExercisePage.tsx`**: one exercise, opened from Today: the video on top, the animation
  with the muscles it works, then Do and
  Avoid (`guideFor` in `features/exercises/guide.ts`). It covers the screen; the phone's back
  closes it.
- **`ui/Workout.tsx`**: one exercise at a time: our animation of it, large and with no tile
  behind it (`BodyDemo bare`; the screen is locked to the phone's height with `Screen fit` and never
  scrolls, so the animation takes the room the rest leaves) with a "How to" chip on its corner
  (either opens `ExercisePage`; with no animation the chip sits under the name), its
  name, the sets as short bars, the counter in a glass row with − and +, how it felt, Log set, then the rest
  clock in the middle of the screen (`Weave`: the logo weaving in as you recover, with the next
  exercise and its small animation under it), which buzzes and chimes when it runs out (not when skipped). A set that beats your best
  shows "New best" over the rest clock. The screen stays on (`useWakeLock`). A friend's cheer
  shows on top. The close button offers finish now, pause, or drop. The
  last set finishes the workout.
- **`ui/After.tsx`**: time, sets, records, the week (done of planned, else of the days picked at
  setup), what went up, how it felt, Share.
- **`ui/useTraining.ts`**: the React hook that loads the save, writes every change through
  `@/platform/store`, and hands screens `update(fn)`.

A session has no XP and no game rewards: it is the log the coach reads.
