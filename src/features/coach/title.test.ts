import { describe, expect, it } from 'vitest';
import { shortTitle, titleKind } from './title';

describe('workout titles', () => {
  it('splits a built-in title into the day and its kind', () => {
    expect(shortTitle('Calisthenics, day A: pull, push, squat')).toBe('Pull, push, squat');
    expect(titleKind('Calisthenics, day A: pull, push, squat')).toBe('Calisthenics');
  });

  it("keeps a coach's own title whole", () => {
    expect(shortTitle('Upper A')).toBe('Upper A');
    expect(titleKind('Upper A')).toBeNull();
  });
});
