import { dayKey } from '@/features/training/days';
import type { TrainingState } from '@/features/training/session';
import { minutesOf } from './validate';
import { daysIn, dayLabel, nextDay, restKept, restToday, shownWeek, weekDoneId, weekdayOf } from './week';

/* The coach speaks first: one thing worth saying now (a missed day, a new week, a rest day to
   keep, a workout done, today's workout), picked by code from the save. It shows as the coach's
   line on Today, and once you open the chat it is said there too, so the coach can talk it
   through. Each nudge has an id and is said once. */

export interface Nudge {
  /** Said once: kept in `coach.heard` after. */
  id: string;
  /** What the coach says. */
  text: string;
}

export function coachNudge(state: TrainingState, now: Date): Nudge | undefined {
  const coach = state.coach;
  if (!coach?.profile) return undefined;
  const today = dayKey(now);
  const week = coach.week;
  const next = nextDay(week);
  const doneToday = week?.days.find((d) => d.done && dayKey(new Date(d.done)) === today);
  if (next && next.date < today)
    return { id: `missed:${next.date}`, text: `${weekdayOf(next.date)}'s workout is still waiting. Do it today, or tell me and I'll move the week around.` };
  // This week's last workout done: next week is already drafted, so it shows right away.
  if (week && doneToday && shownWeek(week, now) === 1)
    return { id: weekDoneId(week), text: `Week done. Next week is ready: ${daysIn(week, 1).map((d) => weekdayOf(d.date)).join(', ')}. Want to change anything?` };
  if (week && next && week.start === today && !week.days.some((d) => d.done) && coach.heard !== `weekdone:${week.start}`)
    return { id: `week:${week.start}`, text: `New week: ${daysIn(week, 0).map((d) => weekdayOf(d.date)).join(', ')}, rest days between. Want to change anything?` };
  if (restToday(coach, now) && !restKept(state, today) && !doneToday)
    return { id: `rest:${today}`, text: 'Rest day. Recovery is part of the plan.' };
  if (doneToday) return { id: `done:${today}`, text: next ? `Good work. Next: ${dayLabel(next.date, now) === 'Tomorrow' ? 'tomorrow' : weekdayOf(next.date)}, ${next.plan.title}.` : 'Week done. Keep your rest days: they count too.' };
  if (next && next.date === today) return { id: `today:${today}`, text: `Today: ${next.plan.title}, about ${minutesOf(next.plan.items)} min.` };
  return undefined;
}

/** A nudge not said yet. */
export function freshNudge(state: TrainingState, now: Date): Nudge | undefined {
  const n = coachNudge(state, now);
  return n && n.id !== state.coach?.heard ? n : undefined;
}

/** The chat opened: the nudge is said in it (unless the coach opens an empty chat itself) and kept as heard. */
export function hearNudge(state: TrainingState, nudge: Nudge, say: boolean): TrainingState {
  const coach = state.coach;
  if (!coach) return state;
  const chat = say ? [...(coach.chat ?? []), { role: 'assistant' as const, content: nudge.text }] : coach.chat;
  return { ...state, coach: { ...coach, heard: nudge.id, ...(chat ? { chat } : {}) } };
}
