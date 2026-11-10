import { describe, expect, it } from 'vitest';
import { initialState, type Session, type TrainingState } from '@/features/training/session';
import { ago, codeInUrl, inviteLink, myCard, showCode, statsNow, statusOf, trainingStats, type FriendCard } from './friends';
import { cleanCheer, quickCheers, CHEER_LIMIT, trainingLabel } from './cheers';
import { cleanLine, newPosts, workoutCard } from './feed';

const card = (p: Partial<FriendCard> = {}): FriendCard => ({ id: 'x', name: 'Ana', trained_at: null, online: false, training: null, seen_at: '2026-10-27T10:00:00Z', ...p });

const session = (date: string, entries: Session['entries'] = [], over: Partial<Session> = {}): Session => ({ id: date, date, kind: 'full', day: 'A', entries, ...over }) as Session;
const set = { reps: 10, rir: '2-3' as const };

describe('friends', () => {
  const now = new Date('2026-10-27T12:00:00Z');

  it('says what a friend is up to, in a word or two', () => {
    expect(statusOf(card({ online: true, training: 'Push day' }), now)).toBe('Push day');
    expect(statusOf(card({ online: true }), now)).toBe('Online');
    expect(statusOf(card({ trained_at: '2026-10-27T08:00:00Z' }), now)).toBe('Trained today');
    expect(statusOf(card(), now)).toBe('2h');
  });

  it('counts time short', () => {
    expect(ago(new Date(now.getTime() - 30_000), now)).toBe('now');
    expect(ago(new Date(now.getTime() - 5 * 60_000), now)).toBe('5m');
    expect(ago(new Date(now.getTime() - 50 * 3600_000), now)).toBe('2d');
  });

  it('reads and writes friend codes', () => {
    expect(showCode('K7QF2M')).toBe('K7Q-F2M');
    expect(codeInUrl(inviteLink('https://x.app', 'K7QF2M'))).toBe('K7QF2M');
    expect(codeInUrl('https://x.app/?friend=k7q-f2m')).toBe('K7QF2M');
    expect(codeInUrl('https://x.app/')).toBeNull();
  });

  it('builds your card and stats from the save', () => {
    const state: TrainingState = {
      ...initialState(),
      profile: { onboarded: true, name: 'Edo' },
      sessions: [session('2026-10-26T10:00:00Z', [{ exerciseId: 'pu', name: 'Push-ups', target: 10, sets: [set, set] }, { exerciseId: 'w', target: 1, sets: [set] }])],
    };
    const c = myCard(state, 'Push day', now);
    expect(c).toMatchObject({ name: 'Edo', training: 'Push day', trained_at: '2026-10-26T10:00:00Z' });
    expect(trainingStats(state, now)).toMatchObject({ workouts: 1, week: 1, top: ['Push-ups'] });
  });

  it("drops a friend's stale week and broken streak", () => {
    const s = { workouts: 9, week: 1, week_of: '2026-10-19', streak: 4, top: [] };
    expect(statsNow(s, now)).toMatchObject({ week: 0, streak: 0, week_of: '2026-10-26' });
  });
});

describe('cheers', () => {
  it('offers short quick lines with the first name', () => {
    expect(quickCheers('Ana Ruiz')[0]).toBe('Go, Ana');
    expect(quickCheers('')[0]).toBe('Go');
  });

  it('tidies and cuts what you type', () => {
    expect(cleanCheer('  one   more \n set ')).toBe('one more set');
    expect(cleanCheer('x'.repeat(200))).toHaveLength(CHEER_LIMIT.length);
  });

  it('names the workout plainly when the coach has none', () => {
    expect(trainingLabel(initialState())).toBe('Workout');
  });
});

describe('feed', () => {
  it('sums a session into a post card, without warm-up taps', () => {
    const s = session('2026-10-27T11:00:00Z', [{ exerciseId: 'w', target: 1, sets: [set] }, { exerciseId: 'pu', name: 'Push-ups', target: 10, sets: [set, set, set] }], { better: true });
    const w = workoutCard(s, { title: 'Push day', startedAt: '2026-10-27T10:08:00Z', taps: new Set(['w']) });
    expect(w).toMatchObject({ title: 'Push day', minutes: 52, sets: 3, exercises: ['Push-ups'], mini: false, records: 1 });
  });

  it('counts new posts that are not yours', () => {
    const posts = [
      { at: '2026-10-27T10:00:00Z', mine: false },
      { at: '2026-10-27T11:00:00Z', mine: true },
      { at: '2026-10-26T10:00:00Z', mine: false },
    ];
    expect(newPosts(posts, '2026-10-27T09:00:00Z')).toBe(1);
    expect(newPosts(posts, null)).toBe(2);
    expect(cleanLine(' a  b ', 2)).toBe('a ');
  });
});
