/* Training numbers, each with its goal. */

/** Workouts a week that count as hitting the goal (the week streak, the dots on Today without a planned week). */
export const WEEKLY_GOAL = 3;

/** Rest after a set when the coach set none and the role gives none (src/features/coach/time.ts). */
export const REST_SECONDS = 90;

/** Goal: strength comes with time, not just sessions. An exercise's target goes up at most this often a week. */
export const MAX_RAISES_PER_WEEK = 2;

/** A workout clock past this many minutes was left running: its time isn't saved. */
export const MAX_WORKOUT_MINUTES = 180;

/** A workout left open this long past its day is closed on the day it was done. */
export const STALE_DRAFT_HOURS = 12;
