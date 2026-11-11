import { describe, expect, it } from 'vitest';
import { ASKS, MANY, question, reaction } from './setupChat';

describe('setup chat', () => {
  it('asks every question, the multi ones with Done', () => {
    expect(ASKS.map((a) => question(a).length > 0)).toEqual(ASKS.map(() => true));
    expect(ASKS.filter((a) => MANY[a])).toEqual(['modes', 'gear']);
  });
  it('says a word back', () => {
    expect(reaction('name', { name: 'Edo' })).toBe('Nice to meet you, Edo.');
    expect(reaction('modes', { modes: ['gym', 'running'] })).toBe('A good mix.');
    expect(reaction('modes', { modes: ['running'] })).toBe('A runner, good.');
    expect(reaction('days', { days: 2 })).toContain('count');
    expect(reaction('days', { days: 5 })).toContain('easy');
    expect(reaction('minutes', { minutes: 40 })).toBeNull();
  });
});
