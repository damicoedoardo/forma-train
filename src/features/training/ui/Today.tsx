'use client';

import { Avatar, Button, Glass } from '@/ui';
import { currentPlan, isRestToday, restKept, todayIs, weekSlots, weekdayOf } from '@/features/coach/week';
import { freshNudge, coachNudge } from '@/features/coach/nudge';
import { minutesOf } from '@/features/coach/validate';
import { shortTitle, titleKind } from '@/features/coach/title';
import { dayKey } from '../days';
import { dayType, isTap, todaysWorkout, type TrainingState, type WorkoutExercise } from '../session';
import { doseText, setCount } from '../workout';

/* Today: the date, the workout, the week at a glance, the coach's one line, and Start. */

const DATE = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export function Today({ state, now, photo, onStart, onRest, onYou, onCoach }: { state: TrainingState; now: Date; photo?: string | null; onStart: () => void; onRest: () => void; onYou: () => void; onCoach: () => void }) {
  const plan = currentPlan(state.coach);
  const workout = todaysWorkout(state);
  const moves = workout.filter((q) => !isTap(q));
  const day = todayIs(state, now);
  const rest = isRestToday(state, now);
  const kept = restKept(state, dayKey(now));
  const going = !!state.draft && Object.values(state.draft.sets).some((l) => l.length > 0);
  const title = plan?.title ?? (dayType(state) === 'A' ? 'Full body A' : 'Full body B');
  const minutes = plan ? minutesOf(plan.items.filter((i) => !i.skipped)) : null;
  const line = freshNudge(state, now) ?? coachNudge(state, now);
  const ahead = day.kind === 'done' || (rest && !going);

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[15px] text-ink-muted">{DATE.format(now)}</span>
        <button type="button" onClick={onYou} aria-label="You" className="rounded-full">
          <Avatar name={state.profile.name ?? ''} src={photo} size={40} />
        </button>
      </div>

      <div className="mt-10 flex flex-col gap-1.5">
        {ahead ? (
          <>
            <span className="text-[15px] text-ink-muted">{day.kind === 'done' ? 'Done today' : kept ? 'Rested' : 'Rest day'}</span>
            <h1 className="font-display text-[40px] font-medium leading-[44px] tracking-[-1.2px]">{day.next ? `Next: ${weekdayOf(day.next.date)}` : 'Week done'}</h1>
            {day.next && <span className="text-[15px] text-ink-muted">{shortTitle(day.next.plan.title)}</span>}
          </>
        ) : (
          <>
            <h1 className="font-display text-[40px] font-medium leading-[44px] tracking-[-1.2px]">{shortTitle(title)}</h1>
            <span className="text-[15px] text-ink-muted">{[titleKind(title), minutes ? `${minutes} min` : null, `${moves.length} moves`].filter(Boolean).join(' · ')}</span>
          </>
        )}
      </div>

      <WeekDots state={state} now={now} />

      {!ahead && (
        <Glass className="mt-6 flex flex-col px-5 py-1">
          {rows(workout).map((r, i) => (
            <div key={r.key} className={`flex items-center justify-between py-3 ${i ? 'border-t hairline' : ''}`}>
              <span className={`text-[16px] ${r.soft ? 'text-ink-muted' : ''}`}>{r.name}</span>
              <span className="text-[15px] tabular-nums text-ink-muted">{r.dose}</span>
            </div>
          ))}
        </Glass>
      )}

      {line && (
        <button type="button" onClick={onCoach} className="glass mt-3 flex items-center gap-3 rounded-[20px] px-4 py-3.5 text-left">
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-accent shadow-[0_0_8px_rgba(110,116,240,0.7)]" />
          <span className="text-[14px] leading-5 text-ink-soft">{line.text}</span>
        </button>
      )}

      <div className="mt-auto flex gap-3 pt-6">
        {going ? (
          <Button className="flex-1" onClick={onStart}>
            Continue · {setCount(state, workout).done}/{setCount(state, workout).of}
          </Button>
        ) : ahead ? (
          <>
            {rest && !kept && (
              <Button className="flex-1" onClick={onRest}>
                Mark rested
              </Button>
            )}
            <Button kind="glass" className="flex-1" onClick={onStart}>
              Train anyway
            </Button>
          </>
        ) : (
          <Button className="flex-1" onClick={onStart}>
            Start
          </Button>
        )}
      </div>
    </>
  );
}

/** The list on Today: the warm-up and the cool-down as one line each, the moves in between. */
function rows(workout: WorkoutExercise[]): { key: string; name: string; dose: string; soft?: boolean }[] {
  const warm = workout.filter((q) => q.role === 'warmup');
  const cool = workout.filter((q) => q.role === 'stretch');
  const mins = (qs: WorkoutExercise[]) => `${Math.max(1, Math.round(qs.reduce((a, q) => a + (q.unit === 'sec' ? q.reps : q.reps * 3), 0) / 60))} min`;
  return [
    ...(warm.length ? [{ key: 'warm', name: 'Warm-up', dose: mins(warm), soft: true }] : []),
    ...workout.filter((q) => !isTap(q)).map((q, i) => ({ key: `${q.id}${i}`, name: q.name, dose: doseText(q) })),
    ...(cool.length ? [{ key: 'cool', name: 'Cool-down', dose: mins(cool), soft: true }] : []),
  ];
}

/** The week as seven dots: filled for done, ringed for today, small for rest. */
function WeekDots({ state, now }: { state: TrainingState; now: Date }) {
  const week = state.coach?.week;
  const today = dayKey(now);
  const slots = week ? weekSlots(week, 0) : [];
  if (!slots.length) return null;
  return (
    <div className="mt-6 flex items-center gap-2" aria-label="This week">
      {slots.map((s) => {
        const done = !!s.day?.done;
        const isToday = s.date === today;
        const train = !!s.day;
        return (
          <span
            key={s.date}
            title={weekdayOf(s.date)}
            className={`h-2.5 flex-1 rounded-full ${done ? 'bg-ink' : train ? 'bg-white/[0.22]' : restKept(state, s.date) ? 'bg-white/[0.10]' : 'bg-white/[0.06]'} ${isToday ? 'ring-1 ring-accent ring-offset-2 ring-offset-base' : ''}`}
          />
        );
      })}
    </div>
  );
}
