import type { TrainingState } from '@/features/training/session';
import { currentPlan } from '@/features/coach/week';

/* Cheers (pure): a short line one friend sends another, mostly while they work out. The api is
   backend/app/routes/cheers.py; the calls are in client.ts. */

/** Server limits (PER_DAY and LENGTH in backend/app/routes/cheers.py): keep the two the same. */
export const CHEER_LIMIT = { perDay: 20, length: 80 } as const;

/** Quick lines to tap, with the friend's first name in. */
export function quickCheers(name: string): string[] {
  const n = name.trim().split(/\s+/)[0] || '';
  const to = n ? `, ${n}` : '';
  return [`Go${to}`, `One more set${to}`, `Strong${to}`, `Proud of you${to}`];
}

/** A cheer as it arrives from a friend. */
export interface Cheer {
  id: string;
  from: string;
  from_name: string;
  text: string;
  at: string;
}

/** What a friend typed, as sent: one line, spaces tidied, cut to the limit. Empty: nothing to send. */
export const cleanCheer = (text: string) => text.split(/\s+/).filter(Boolean).join(' ').slice(0, CHEER_LIMIT.length);

/** What friends see while you work out: the coach's name for today, or "Workout" (the built-in
    plan's own title is about the plan, not the day). */
export function trainingLabel(state: Pick<TrainingState, 'coach'>): string {
  const plan = currentPlan(state.coach);
  return (plan && plan.by !== 'built-in' ? plan.title : 'Workout').slice(0, 40);
}
