'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, Dumbbell } from 'lucide-react';
import { Button, Glass, Mark, Ring } from '@/ui';
import { currentPlan, isRestToday, restKept, todayIs, weekRing, weekSlots, weekdayOf } from '@/features/coach/week';
import { freshNudge, coachNudge } from '@/features/coach/nudge';
import { minutesOf } from '@/features/coach/validate';
import { shortTitle, titleKind } from '@/features/coach/title';
import { dayKey } from '../days';
import { dayType, isTap, todaysWorkout, type TrainingState, type WorkoutExercise } from '../session';
import { doseText, setCount } from '../workout';
import { ExercisePage } from './ExercisePage';
import { BodyDemo } from './BodyDemo';
import { anatomyFor } from '@/features/exercises/anatomy/body';

/* Today: the hero (the date, the workout, the week as a ring, a live preview that plays each of
   today's moves in turn, the week's days), the coach's one line, the list, and Start. The list
   shows each move as a still; the one on stage is lit. A move opens its page: the video, what to
   do, what to avoid. */

/** How long each move stays on the hero's stage: two reps. */
const SHOW = 7200;

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
  const close = useCallback(() => setOpen(null), []);
  // The moves we can show on the stage, and which one is on now.
  const cast = moves.filter((q) => anatomyFor(q.move, q.name));
  const [at, setAt] = useState(0);
  useEffect(() => {
    if (cast.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setAt((a) => a + 1), SHOW);
    return () => window.clearInterval(t);
  }, [cast.length]);
  const onStage = cast.length ? cast[at % cast.length] : null;
  const stage = !ahead && onStage;

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
      <span aria-hidden className="hero-sheen" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="mb-3 text-[13px] text-white/60">{DATE.format(now)}</span>
          {ahead ? (
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
        {ring && (
          <Ring className="turn-in" size={72} stroke={5} of={ring.of} done={ring.done} now={day.kind === 'workout'} label={`${ring.done} of ${ring.of} workouts this week`}>
            <span className="num font-display text-[17px] leading-none">
              {ring.done}
              <span className="text-white/50">/{ring.of}</span>
            </span>
          </Ring>
        )}
      </div>
      {stage && (
        <button type="button" aria-label={`${stage.name}: how to do it`} onClick={() => setOpen(stage)} className="press relative mt-3 block h-[200px] w-full text-left">
          {/* Each move walks on, does two reps, and makes room for the next. */}
          <BodyDemo key={`${stage.id}${at}`} bare move={stage.move} name={stage.name} className="walk-on absolute inset-0 h-full w-full" />
          <span key={`n${at}`} className="walk-on absolute bottom-0 left-0 flex flex-col gap-0.5">
            <span className="num text-[12px] text-white/50">
              {String((at % cast.length) + 1).padStart(2, '0')} / {String(cast.length).padStart(2, '0')}
            </span>
            <span className="text-[15px] text-white/90">{stage.name}</span>
          </span>
          {cast.length > 1 && (
            <span aria-hidden className="absolute bottom-1.5 right-0 flex gap-1">
              {cast.map((q, i) => (
                <span key={i} className="h-1 w-4 overflow-hidden rounded-full bg-white/[0.16]">
                  {i === at % cast.length ? <span key={at} className="pip block h-full rounded-full bg-white/90" style={{ animationDuration: `${SHOW}ms` }} /> : i < at % cast.length ? <span className="block h-full bg-white/60" /> : null}
                </span>
              ))}
            </span>
          )}
        </button>
      )}
      <WeekDots state={state} now={now} />
      </div>

      {line && (
        <button type="button" onClick={onCoach} className="glass press mt-3 flex items-center gap-3 rounded-[20px] px-4 py-3.5 text-left">
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-accent shadow-[0_0_8px_rgba(110,116,240,0.7)]" />
          <span className="text-[14px] leading-5 text-ink-soft">{line.text}</span>
        </button>
      )}

      {!ahead && (
        <Glass className="mt-3 flex flex-col px-5 py-1">
          {rows(workout).map((r, i) =>
            r.q ? (
              <button key={r.key} type="button" onClick={() => setOpen(r.q!)} className={`press flex items-center gap-3 py-2.5 text-left ${i ? 'border-t hairline' : ''}`}>
                <BodyDemo small paused move={r.q.move} name={r.q.name} className={`h-[52px] w-[52px] rounded-[14px] ring-1 transition-shadow duration-500 ${r.q === stage ? 'ring-accent-iris/70 shadow-[0_0_14px_rgba(110,116,240,0.45)]' : 'ring-transparent'}`} />
                <span className={`min-w-0 flex-1 truncate text-[16px] transition-colors duration-500 ${stage && r.q !== stage ? 'text-ink-soft' : ''}`}>{r.name}</span>
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


      <div className="sticky z-10 mt-auto flex gap-3 pt-6" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 96px)' }}>
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
    dot, and today's letter is bright with the accent under it. */
function WeekDots({ state, now }: { state: TrainingState; now: Date }) {
  const week = state.coach?.week;
  const today = dayKey(now);
  const slots = week ? weekSlots(week, 0) : [];
  if (!slots.length) return null;
  return (
    <div className="relative mt-5 grid grid-cols-7 border-t border-white/10 pt-4" aria-label="This week">
      {slots.map((s) => {
        const done = !!s.day?.done;
        const isToday = s.date === today;
        const train = !!s.day;
        return (
          <div key={s.date} className="day-in flex flex-col items-center gap-2.5" style={{ animationDelay: `${260 + slots.indexOf(s) * 45}ms` }} title={weekdayOf(s.date)}>
            <span className={`text-[12px] ${isToday ? 'font-medium text-ink' : 'text-white/45'}`}>{weekdayOf(s.date)[0]}</span>
            <span className="flex h-3.5 items-center">
              {done ? (
                <span className="h-3.5 w-3.5 rounded-full bg-ink" />
              ) : train ? (
                <span className={`h-3.5 w-3.5 rounded-full border-[1.5px] ${isToday ? 'border-accent shadow-[0_0_10px_rgba(110,116,240,0.7)]' : 'border-white/30'}`} />
              ) : (
                <span className={`h-1.5 w-1.5 rounded-full ${restKept(state, s.date) ? 'bg-white/40' : 'bg-white/[0.14]'}`} />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
