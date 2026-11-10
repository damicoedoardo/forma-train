import { describe, expect, it } from 'vitest';
import { finishSession, initialState, todaysWorkout, type TrainingState } from './session';
import { beatsBest, clockText, currentIndex, doseText, dropWorkout, lastTime, leaveWorkout, logSet, setCount, setsWanted, skipRest, startReps, startWorkout, undoSet } from './workout';

const NOW = new Date('2026-11-10T18:00:00Z');
const fresh = (): TrainingState => ({ ...initialState(), profile: { onboarded: true, kit: 'home' } });

describe('a workout under way', () => {
  it('starts once, and opens again where it was', () => {
    const s = startWorkout(fresh(), NOW);
    expect(s.draft).toMatchObject({ startedAt: NOW.toISOString(), checkin: 'normal', sets: {}, open: true });
    const left = leaveWorkout(logSet(s, 'x', { reps: 5, rir: '2-3' }, NOW));
    expect(left.draft?.open).toBe(false);
    expect(startWorkout(left, new Date(NOW.getTime() + 60_000)).draft).toMatchObject({ startedAt: NOW.toISOString(), open: true, sets: { x: [{ reps: 5 }] } });
    expect(dropWorkout(left).draft).toBeNull();
  });

  it('walks through the exercises in order, a tap for warm-ups and stretches', () => {
    let s = startWorkout(fresh(), NOW);
    const w = todaysWorkout(s);
    expect(currentIndex(s, w)).toBe(0);
    for (const q of w) for (let i = 0; i < setsWanted(q); i++) s = logSet(s, q.id, { reps: q.reps, rir: '2-3' }, NOW);
    expect(currentIndex(s, w)).toBe(-1);
    const n = setCount(s, w);
    expect(n.done).toBe(n.of);
    expect(finishSession(s, NOW)?.session.kind).toBe('full');
  });

  it('runs the rest clock, and lets you skip it or take a set back', () => {
    const s = logSet(startWorkout(fresh(), NOW), 'pu', { reps: 9, rir: '0-1' }, NOW, 90);
    expect(s.draft?.restUntil).toBe(NOW.getTime() + 90_000);
    expect(skipRest(s).draft?.restUntil).toBeNull();
    expect(undoSet(s, 'pu').draft?.sets.pu).toEqual([]);
  });

  it('starts the counter at your last set, and remembers last time', () => {
    let s = startWorkout(fresh(), NOW);
    const q = todaysWorkout(s).find((x) => x.role === 'main')!;
    expect(startReps(s, q)).toBe(q.reps);
    s = logSet(s, q.id, { reps: q.reps + 2, rir: '4+' }, NOW);
    expect(startReps(s, q)).toBe(q.reps + 2);
    const done = finishSession(s, NOW)!.state;
    expect(lastTime(done, q.id)).toBe(q.reps + 2);
    expect(lastTime(done, 'nothing')).toBeNull();
    // A best: more than last time and more than any set today. Nothing to beat the first time.
    expect(beatsBest(done, q.id, q.reps + 2)).toBe(false);
    expect(beatsBest(done, q.id, q.reps + 3)).toBe(true);
    expect(beatsBest(done, 'nothing', 99)).toBe(false);
    const again = logSet(startWorkout(done, new Date()), q.id, { reps: q.reps + 4, rir: '2-3' }, new Date());
    expect(beatsBest(again, q.id, q.reps + 4)).toBe(false);
    expect(beatsBest(again, q.id, q.reps + 5)).toBe(true);
  });

  it('reads short', () => {
    expect(clockText(18 * 60_000 + 42_000)).toBe('18:42');
    expect(clockText(3_725_000)).toBe('1:02:05');
    const q = todaysWorkout(fresh()).find((x) => x.role === 'main')!;
    expect(doseText(q)).toMatch(/^\d+ × \d+s?$/);
  });
});
