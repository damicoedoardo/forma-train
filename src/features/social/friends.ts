import { sessionsThisWeek, weekKey, weekStreak, WEEKLY_GOAL, type TrainingState } from '@/features/training/session';
import { dayKey } from '@/features/training/days';

/* Friends (pure). Each person has a card on the server that friends see: a name, when they last
   trained, whether the app is open, and the workout they are doing right now. The api is
   backend/app/routes/friends.py; the calls are in client.ts. */

/** How you train, from the save, for your profile: workouts in all, this week's (its Monday in
    `week_of`, so a friend can tell a stale count), the weekly-goal streak and the exercises you do
    most. Only friends see it. */
export interface TrainingStats {
  workouts: number;
  week: number;
  week_of: string;
  streak: number;
  top: string[];
}

/** How many sessions back the "does most" exercises are counted, and how many are named. */
const TOP_FROM = 20;
const TOP_N = 3;

export function trainingStats(state: Pick<TrainingState, 'sessions'>, now: Date): TrainingStats {
  // Exercises with real work (two sets or more: warm-ups and stretches are one tap), by how many
  // of the last sessions had them.
  const seen = new Map<string, number>();
  for (const s of state.sessions.slice(-TOP_FROM))
    for (const e of s.entries)
      if (e.sets.length >= 2) {
        const name = (e.name ?? e.exerciseId).slice(0, 40);
        seen.set(name, (seen.get(name) ?? 0) + 1);
      }
  return {
    workouts: state.sessions.length,
    week: sessionsThisWeek(state, now),
    week_of: weekKey(now),
    streak: weekStreak(state, now),
    top: [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_N).map(([n]) => n),
  };
}

/** A friend's stats as of `now` on this phone: a week that is over counts 0, and a streak whose
    last week passed without the goal is gone. */
export function statsNow(s: TrainingStats, now: Date): TrainingStats {
  const thisWeek = weekKey(now);
  const lastWeek = weekKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7));
  const week = s.week_of === thisWeek ? s.week : 0;
  const alive = s.week_of === thisWeek || (s.week_of === lastWeek && s.week >= WEEKLY_GOAL);
  return { ...s, week, week_of: thisWeek, streak: alive ? s.streak : 0 };
}

/** What this phone sends about you. */
export interface MyCard {
  trained_at: string | null;
  /** The workout you are doing right now, or null. */
  training: string | null;
  stats: TrainingStats;
  name?: string;
}

/** Server limits for the profile (PLACE, ABOUT, PHOTO_BYTES in backend/app/routes/friends.py):
    keep the two the same. `photoEdge` is the square the phone makes a photo before sending it. */
export const PROFILE_LIMIT = { place: 40, about: 140, photoBytes: 200_000, photoEdge: 480 } as const;

/** What a person tells friends, all optional. `photo` is when it last changed (null: none). */
export interface Profile {
  place: string;
  about: string;
  photo: string | null;
  stats?: TrainingStats | null;
}

/** A friend as the api returns them. */
export interface FriendCard extends Partial<Profile> {
  id: string;
  name: string;
  trained_at: string | null;
  online: boolean;
  /** The workout they are doing right now (only while online). */
  training: string | null;
  seen_at: string;
}

export interface FriendsList {
  me: { id?: string; code: string; name: string } & Partial<Profile>;
  friends: FriendCard[];
  asks_in: FriendCard[];
  asks_out: FriendCard[];
}

/** Your card, from the save. */
export function myCard(state: TrainingState, training: string | null = null, now: Date = new Date()): MyCard {
  return {
    trained_at: state.sessions.at(-1)?.date ?? null,
    training,
    stats: trainingStats(state, now),
    ...(state.profile.name ? { name: state.profile.name } : {}),
  };
}

/** Trained on this phone's today (a friend far away may see a different day, which is fine). */
export const friendTrainedToday = (f: Pick<FriendCard, 'trained_at'>, now: Date) => !!f.trained_at && dayKey(new Date(f.trained_at)) === dayKey(now);

/** The short line under a friend's name. */
export function statusOf(f: FriendCard, now: Date): string {
  if (f.training) return f.training;
  if (f.online) return 'Online';
  if (friendTrainedToday(f, now)) return 'Trained today';
  return ago(new Date(f.seen_at), now);
}

/** "now", "5m", "3h", "2d". */
export function ago(then: Date, now: Date): string {
  const min = Math.max(0, Math.round((now.getTime() - then.getTime()) / 60000));
  if (min < 2) return 'now';
  if (min < 60) return `${min}m`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

/** A code as people read it: "K7Q-F2M". */
export const showCode = (code: string) => (code.length === 6 ? `${code.slice(0, 3)}-${code.slice(3)}` : code);

/** The friend code in an invite link (…/?friend=K7QF2M), or null. */
export function codeInUrl(href: string): string | null {
  try {
    const c = new URL(href).searchParams.get('friend');
    const clean = (c ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return clean.length >= 4 && clean.length <= 12 ? clean : null;
  } catch {
    return null;
  }
}

/** The link to send a friend. */
export const inviteLink = (origin: string, code: string) => `${origin}/?friend=${code}`;

