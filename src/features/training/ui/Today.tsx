'use client';

import { useCallback, useState } from 'react';
import { ChevronRight, Dumbbell } from 'lucide-react';
import { Button, Glass, Mark, Ring, Silk } from '@/ui';
import { currentPlan, isRestToday, restKept, todayIs, weekRing, weekSlots, weekdayOf } from '@/features/coach/week';
import { freshNudge, coachNudge } from '@/features/coach/nudge';
import { minutesOf } from '@/features/coach/validate';
import { shortTitle, titleKind } from '@/features/coach/title';
import { dayKey } from '../days';
import { dayType, isTap, planWorkout, todaysWorkout, type TrainingState, type WorkoutExercise } from '../session';
import { doseText, setCount } from '../workout';
import { ExercisePage } from './ExercisePage';
import { BodyDemo } from './BodyDemo';

/* Today: the date, the workout, the week as a ring and at a glance (tap a day to look at its workout), the coach's one line, and Start. Each
   move in the list plays our own animation of it and opens its page: the video, what to do, what to avoid. */

const DATE = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export function Today({ state, now, onStart, onRest, onCoach }: { state: TrainingState; now: Date; onStart: () => void; onRest: () => void; onCoach: () => void }) {
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
  const ring = weekRing(state.coach?.week, now);
  const [open, setOpen] = useState<WorkoutExercise | null>(null);
  // Another day of the week, picked in the hero to look at (null: today).
  const [pick, setPick] = useState<string | null>(null);
  const today = dayKey(now);
  const peek = pick && pick !== today ? (state.coach?.week ? weekSlots(state.coach.week, 0).find((x) => x.date === pick) : undefined) : undefined;
  const peekList = peek?.day ? planWorkout(state, peek.day.plan) : [];
  const close = useCallback(() => setOpen(null), []);

  return (
    <>
      <div className="flex items-center justify-between">
        <Mark />
        <span className="glass flex h-10 items-center gap-2 rounded-pill pl-3 pr-3.5" aria-label={`${state.sessions.length} workouts done`}>
          <Dumbbell size={16} strokeWidth={2} className="text-accent-soft" aria-hidden />
          <span className="num font-display text-[15px] font-medium">{state.sessions.length}</span>
        </span>
      </div>

      <div className="hero relative mt-7 overflow-hidden rounded-[28px] px-5 pb-5 pt-5">
      {/* A ribbon of light drifts through the card; slower on rest and done days. */}
      <Silk calm={ahead} className="absolute inset-0 h-full w-full" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="mb-3 text-[13px] text-white/60">{DATE.format(peek ? new Date(`${peek.date}T12:00:00`) : now)}</span>
          <div key={peek?.date ?? 'today'} className="fade flex flex-col gap-1.5">
          {peek ? (
            peek.day ? (
              <>
                <h1 className="font-display text-[34px] font-medium leading-[38px] tracking-[-1px]">{shortTitle(peek.day.plan.title)}</h1>
                <span className="text-[15px] text-white/60">{[titleKind(peek.day.plan.title), `${minutesOf(peek.day.plan.items.filter((i) => !i.skipped))} min`, peek.day.done ? 'Done' : `${peekList.filter((q) => !isTap(q)).length} moves`].join(' · ')}</span>
              </>
            ) : (
              <>
                <h1 className="font-display text-[34px] font-medium leading-[38px] tracking-[-1px]">Rest day</h1>
                <span className="text-[15px] text-white/60">{restKept(state, peek.date) ? 'Rested' : 'Nothing planned'}</span>
              </>
            )
          ) : ahead ? (
            <>
              <span className="text-[15px] text-white/60">{day.kind === 'done' ? 'Done today' : kept ? 'Rested' : 'Rest day'}</span>
              <h1 className="font-display text-[34px] font-medium leading-[38px] tracking-[-1px]">{day.next ? `Next: ${weekdayOf(day.next.date)}` : 'Week done'}</h1>
              {day.next && <span className="text-[15px] text-white/60">{shortTitle(day.next.plan.title)}</span>}
            </>
          ) : (
            <>
              <h1 className="font-display text-[34px] font-medium leading-[38px] tracking-[-1px]">{shortTitle(title)}</h1>
              <span className="text-[15px] text-white/60">{[titleKind(title), minutes ? `${minutes} min` : null, `${moves.length} moves`].filter(Boolean).join(' · ')}</span>
            </>
          )}
          </div>
        </div>
        {ring && (
          <Ring className="turn-in" size={72} stroke={5} of={ring.of} done={ring.done} now={day.kind === 'workout'} label={`${ring.done} of ${ring.of} workouts this week`}>
            <span className="num font-display text-[17px] leading-none">
              {ring.done}
              <span className="text-white/50">/{ring.of}</span>
            </span>
          </Ring>
        )}
      </div>
      <WeekDots state={state} now={now} pick={peek?.date ?? today} onPick={(d) => setPick(d === today ? null : d)} />
      </div>

      {line && !peek && (
        <button type="button" onClick={onCoach} className="glass press mt-3 flex items-center gap-3 rounded-[20px] px-4 py-3.5 text-left">
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-accent shadow-[0_0_8px_rgba(110,116,240,0.7)]" />
          <span className="text-[14px] leading-5 text-ink-soft">{line.text}</span>
        </button>
      )}

      {peek ? (
        peekList.length > 0 && (
          <Glass key={peek.date} className="fade mt-3 flex flex-col px-5 py-1">
            {rows(peekList).map((r, i) =>
              r.q ? (
                <button key={r.key} type="button" onClick={() => setOpen(r.q!)} className={`press flex items-center gap-3 py-2.5 text-left ${i ? 'border-t hairline' : ''}`}>
                  <BodyDemo small move={r.q.move} name={r.q.name} className="h-[52px] w-[52px] rounded-[14px]" />
                  <span className="min-w-0 flex-1 truncate text-[16px]">{r.name}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="num text-[15px] text-ink-muted">{r.dose}</span>
                    <ChevronRight size={16} strokeWidth={2} className="-mr-1 text-ink-faint" aria-hidden />
                  </span>
                </button>
              ) : (
                <div key={r.key} className={`flex items-center justify-between py-[11px] ${i ? 'border-t hairline' : ''}`}>
                  <span className="text-[16px] text-ink-muted">{r.name}</span>
                  <span className="num text-[15px] text-ink-muted">{r.dose}</span>
                </div>
              ),
            )}
          </Glass>
        )
      ) : !ahead && (
        <Glass className="mt-3 flex flex-col px-5 py-1">
          {rows(workout).map((r, i) =>
            r.q ? (
              <button key={r.key} type="button" onClick={() => setOpen(r.q!)} className={`press flex items-center gap-3 py-2.5 text-left ${i ? 'border-t hairline' : ''}`}>
                <BodyDemo small move={r.q.move} name={r.q.name} className="h-[52px] w-[52px] rounded-[14px]" />
                <span className="min-w-0 flex-1 truncate text-[16px]">{r.name}</span>
                <span className="flex items-center gap-1.5">
                  <span className="num text-[15px] text-ink-muted">{r.dose}</span>
                  <ChevronRight size={16} strokeWidth={2} className="-mr-1 text-ink-faint" aria-hidden />
                </span>
              </button>
            ) : (
              <div key={r.key} className={`flex items-center justify-between py-[11px] ${i ? 'border-t hairline' : ''}`}>
                <span className="text-[16px] text-ink-muted">{r.name}</span>
                <span className="num text-[15px] text-ink-muted">{r.dose}</span>
              </div>
            ),
          )}
        </Glass>
      )}


      <div className="mt-4 flex gap-3">
        {peek ? (
          <Button kind="glass" className="flex-1" onClick={() => setPick(null)}>
            Back to today
          </Button>
        ) : going ? (
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

      {open && <ExercisePage q={open} onClose={close} />}
    </>
  );
}

/** The list on Today: the warm-up and the cool-down as one line each, the moves in between. */
function rows(workout: WorkoutExercise[]): { key: string; name: string; dose: string; q?: WorkoutExercise }[] {
  const warm = workout.filter((q) => q.role === 'warmup');
  const cool = workout.filter((q) => q.role === 'stretch');
  const mins = (qs: WorkoutExercise[]) => `${Math.max(1, Math.round(qs.reduce((a, q) => a + (q.unit === 'sec' ? q.reps : q.reps * 3), 0) / 60))} min`;
  return [
    ...(warm.length ? [{ key: 'warm', name: 'Warm-up', dose: mins(warm) }] : []),
    ...workout.filter((q) => !isTap(q)).map((q, i) => ({ key: `${q.id}${i}`, name: q.name, dose: doseText(q), q })),
    ...(cool.length ? [{ key: 'cool', name: 'Cool-down', dose: mins(cool) }] : []),
  ];
}

/** The week as seven days: a letter and a mark. Done is lit, a workout ahead is a ring, rest is a
    dot, and today's letter is bright with the accent under it. Each day is a tap: the hero shows
    that day's workout, and a soft pill sits behind the day on show. */
function WeekDots({ state, now, pick, onPick }: { state: TrainingState; now: Date; pick: string; onPick: (date: string) => void }) {
  const week = state.coach?.week;
  const today = dayKey(now);
  const slots = week ? weekSlots(week, 0) : [];
  if (!slots.length) return null;
  return (
    <div role="tablist" aria-label="This week" className="relative mt-[76px] grid grid-cols-7 border-t border-white/10 pt-3">
      {slots.map((s, n) => {
        const done = !!s.day?.done;
        const isToday = s.date === today;
        const train = !!s.day;
        const on = s.date === pick;
        return (
          <button
            key={s.date}
            type="button"
            role="tab"
            aria-selected={on}
            aria-label={`${weekdayOf(s.date)}${isToday ? ', today' : ''}`}
            onClick={() => onPick(s.date)}
            className={`day-in press mx-auto flex w-10 flex-col items-center gap-2.5 rounded-[14px] py-2 transition-colors duration-300 ${on ? 'bg-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]' : ''}`}
            style={{ animationDelay: `${260 + n * 45}ms` }}
          >
            <span className={`text-[12px] ${isToday || on ? 'font-medium text-ink' : 'text-white/45'}`}>{weekdayOf(s.date)[0]}</span>
            <span className="flex h-3.5 items-center">
              {done ? (
                <span className="h-3.5 w-3.5 rounded-full bg-ink" />
              ) : train ? (
                <span className={`h-3.5 w-3.5 rounded-full border-[1.5px] ${isToday ? 'border-accent shadow-[0_0_10px_rgba(110,116,240,0.7)]' : on ? 'border-white/70' : 'border-white/30'}`} />
              ) : (
                <span className={`h-1.5 w-1.5 rounded-full ${restKept(state, s.date) ? 'bg-white/40' : 'bg-white/[0.14]'}`} />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
