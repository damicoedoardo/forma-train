import { describe, expect, it } from 'vitest';
import { loadLibrary } from './library';
import { guideFor } from './guide';

describe('an exercise page', () => {
  it('has a video, what to do and what to avoid, for library and built-in ids', async () => {
    const all = await loadLibrary();
    const push = guideFor(all, { id: 'Pushups', name: 'Push-ups' });
    expect(push.video?.id).toBeTruthy();
    expect(push.dos.length).toBeGreaterThan(0);
    expect(push.donts.length).toBeGreaterThan(0);
    expect(push.dos.length).toBeLessThanOrEqual(4);
    expect(push.muscles).toContain('Chest');
    // FORMA's own move, named without its prefix.
    expect(guideFor(all, { id: 'tuck-lsit', name: 'Tuck L-sit' }).dos.length).toBeGreaterThan(0);
    // Only a move: its coaching, no video.
    const bare = guideFor(all, { id: 'nothing', name: 'Squat', move: 'squat' });
    expect(bare.dos.length).toBeGreaterThan(0);
    expect(bare.video).toBeNull();
  });
});
