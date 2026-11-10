import { isTap, todaysWorkout, type Checkin, type Rir, type SetLog, type TrainingState, type WorkoutExercise } from './session';

/* The workout under way (pure): start it, log a set, see where you are. The screen is
   ui/Workout.tsx; finishing is finishSession in session.ts. */

/** The feel of a set, as the screen names it, and the reps-in-reserve the save keeps. */
export const FEEL: { value: Rir; label: string }[] = [
  { value: '4+', label: 'Easy' },
  { value: '2-3', label: 'Right' },
  { value: '0-1', label: 'Hard' },
];

/** Start today's workout (or open it again if one is under way). */
export function startWorkout(state: TrainingState, now: Date, checkin: Checkin = 'normal'): TrainingState {
  if (state.draft) return { ...state, draft: { ...state.draft, open: true } };
  return { ...state, draft: { startedAt: now.toISOString(), checkin, sets: {}, open: true } };
}

/** Leave the workout screen; the sets stay, and Today offers to go on. */
export const leaveWorkout = (state: TrainingState): TrainingState => (state.draft ? { ...state, draft: { ...state.draft, open: false } } : state);

/** Drop the workout under way, sets and all. */
export const dropWorkout = (state: TrainingState): TrainingState => ({ ...state, draft: null });

/** Sets logged for an exercise so far. */
export const setsOf = (state: Pick<TrainingState, 'draft'>, id: string) => state.draft?.sets[id] ?? [];

/** Sets an exercise asks for: a warm-up or a stretch is one tap. */
export const setsWanted = (q: WorkoutExercise) => (isTap(q) ? 1 : q.sets);

/** The exercise to do now: the first one not finished, or -1 when all are. */
export function currentIndex(state: TrainingState, workout: WorkoutExercise[] = todaysWorkout(state)): number {
  return workout.findIndex((q) => setsOf(state, q.id).length < setsWanted(q));
}

/** Log one set. `restSeconds` starts the rest clock (0: none, as after a tap or the last set). */
export function logSet(state: TrainingState, id: string, set: SetLog, now: Date, restSeconds = 0): TrainingState {
  const draft = state.draft;
  if (!draft) return state;
  return {
    ...state,
    draft: { ...draft, sets: { ...draft.sets, [id]: [...(draft.sets[id] ?? []), set] }, restUntil: restSeconds > 0 ? now.getTime() + restSeconds * 1000 : null },
  };
}

/** Take back the last set of an exercise. */
export function undoSet(state: TrainingState, id: string): TrainingState {
  const draft = state.draft;
  if (!draft?.sets[id]?.length) return state;
  return { ...state, draft: { ...draft, sets: { ...draft.sets, [id]: draft.sets[id].slice(0, -1) }, restUntil: null } };
}

/** End the rest early. */
export const skipRest = (state: TrainingState): TrainingState => (state.draft ? { ...state, draft: { ...state.draft, restUntil: null } } : state);

/** The best set of this exercise the last time you did it, or null. */
export function lastTime(state: Pick<TrainingState, 'sessions'>, id: string): number | null {
  const last = state.sessions.findLast((s) => s.entries.some((e) => e.exerciseId === id));
  const entry = last?.entries.find((e) => e.exerciseId === id);
  return entry?.sets.length ? Math.max(...entry.sets.map((x) => x.reps)) : null;
}

/** A set that beats your best: more than the best set last time, and more than any set today.
    Nothing to beat the first time you do an exercise. */
export function beatsBest(state: Pick<TrainingState, 'sessions' | 'draft'>, id: string, reps: number): boolean {
  const last = lastTime(state, id);
  if (last === null) return false;
  return reps > Math.max(last, ...setsOf(state, id).map((x) => x.reps));
}

/** Where a set starts on the counter: what you did in the last set, else the target. */
export const startReps = (state: TrainingState, q: WorkoutExercise) => setsOf(state, q.id).at(-1)?.reps ?? q.reps;

/** Rest after a set of this exercise, in seconds: the coach's, else the default. */
export const restFor = (q: WorkoutExercise, fallback: number) => q.item?.rest ?? fallback;

/** Real sets logged and asked for, leaving out warm-up and stretch taps. */
export function setCount(state: TrainingState, workout: WorkoutExercise[] = todaysWorkout(state)): { done: number; of: number } {
  const real = workout.filter((q) => !isTap(q));
  return { done: real.reduce((a, q) => a + Math.min(setsOf(state, q.id).length, q.sets), 0), of: real.reduce((a, q) => a + q.sets, 0) };
}

/** "18:42": the clock since the workout started. */
export function clockText(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** "3 × 10" or "3 × 30s" or "5 min": how an exercise reads in a list. */
export function doseText(q: WorkoutExercise): string {
  if (q.run) return `${q.reps} min`;
  const unit = q.unit === 'sec' ? 's' : '';
  return isTap(q) ? `${q.reps}${unit}` : `${q.sets} × ${q.reps}${unit}`;
}
