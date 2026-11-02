---
type: reference
title: Exercises
description: The exercise library (catalog.json plus built-in runs), movement ids, kit, families and coaching cues, and the video links.
tags: [exercises, library, movements, videos]
timestamp: 2026-11-02
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

Tests (`library.test.ts`, `videos.test.ts`) check every id resolves and every video points at a
real exercise.
