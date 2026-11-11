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
- **`photos.ts`**: `photosOf` gives a catalog exercise's two photos (start and end of the move)
  from free-exercise-db on GitHub; shown one after the other they make a short loop. FORMA's own
  moves and the runs have none.

Tests (`library.test.ts`, `videos.test.ts`) check every id resolves and every video points at a
real exercise.
