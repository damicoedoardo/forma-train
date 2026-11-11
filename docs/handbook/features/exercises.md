---
type: reference
title: Exercises
description: The exercise library (catalog.json plus built-in runs), movement ids, kit, families and coaching cues, and the video links.
tags: [exercises, library, movements, videos]
timestamp: 2026-11-11
---

# Exercises

`src/features/exercises/` is the data the planner and the screens read.

- **`library.ts`**: `loadLibrary()` reads `catalog.json` and adds the built-in runs
  (`forma:easy-run` and friends). Each exercise has an id, name, level, equipment, steps and a
  `move` (the movement it trains).
- **`movements.ts`**: the movement ids (`PROGRAM_MOVES`, `LIBRARY_MOVES`), the kit a person has
  (`Kit`, `defaultKit`).
- **`classify.ts`, `coaching.ts`**: families (squat, hinge, push, pull…), patterns and cues.
- **`videos.ts`, `videos.found.json`**: a how-to video per exercise where one was found.
- **`guide.ts`**: `guideFor` builds an exercise's page: the video, up to four things to do (the
  movement's tips) and to avoid (its common mistakes), and the muscles it works. It takes library
  ids, FORMA's own moves with or without `forma:`, and built-in ids that are only a move.
- **`anatomy/`**: Forma's own exercise animations, brought over from the game (2026-11-11): a
  plain vector body doing one rep, the worked muscles colored (main in the accent, helpers in
  iris). `anatomyFor(move, name)` picks the demo for an exercise (147 demos, about 880 of the
  890 exercises); `scene(id, view, t)` gives the SVG paths for a moment of the rep. Pure
  geometry (`skeleton.ts`, `keys.ts`, `moves.ts`, `body.ts`); colors are `INK` in `body.ts`.
  `scene(…, { rich: true })` is the look the app uses for every demo: skin lit from above
  (`INK_RICH`, gradients named `fm-skin`, `fm-far`, `fm-floor` that the player defines), no
  arrow, a slow way down and a quicker way back, worked muscles that brighten with the effort,
  and extra shapes marked `kind`: `ghost` (the body at the far end of the move), `shadow`
  (on the floor) and `glow` (over a working muscle). `features/training/ui/BodyDemo.tsx`
  plays it.

Tests (`library.test.ts`, `videos.test.ts`) check every id resolves and every video points at a
real exercise.
