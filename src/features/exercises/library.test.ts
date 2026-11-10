import { describe, expect, it } from 'vitest';
import { findExercises, loadLibrary } from './library';
import { COACHING } from './coaching';
import { MOVE_IDS } from './movements';

describe('exercise library', () => {
  it('loads the catalog and the program moves it lacks, with unique ids', async () => {
    const all = await loadLibrary();
    expect(all.length).toBeGreaterThan(850);
    expect(new Set(all.map((x) => x.id)).size).toBe(all.length);
    for (const x of all) {
      expect(x.name).toBeTruthy();
    }
  });

  it('every exercise has a real move and coaching', async () => {
    for (const x of await loadLibrary()) {
      expect(MOVE_IDS, x.id).toContain(x.move);
      expect(x.tips.length, x.id).toBeGreaterThan(0);
      expect(x.mistakes.length, x.id).toBeGreaterThan(0);
    }
  });

  it('every movement has coaching and is used by the library', async () => {
    const shown = new Set((await loadLibrary()).map((x) => x.move));
    for (const move of MOVE_IDS) {
      expect(COACHING[move], move).toBeTruthy();
      if (move !== 'pullup') expect(shown.has(move), move).toBe(true);
    }
  });

  it('finds exercises the way a coach asks', async () => {
    const all = await loadLibrary();
    const stretches = findExercises(all, { kind: 'stretch', muscles: ['hamstrings'] });
    expect(stretches.length).toBeGreaterThan(3);
    expect(stretches.every((x) => x.kind === 'stretch' && x.primary.includes('hamstrings'))).toBe(true);
    const hinges = findExercises(all, { family: 'hinge', equipment: ['body only', 'dumbbell'], maxLevel: 'beginner' });
    expect(hinges.length).toBeGreaterThan(0);
    expect(hinges.every((x) => x.level === 'beginner' && ['body only', 'dumbbell'].includes(x.equipment))).toBe(true);
    expect(findExercises(all, { text: 'bench press', limit: 3 })).toHaveLength(3);
  });
});
