'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Play, Undo2, X } from 'lucide-react';
import { Avatar, Button, Glass, Ring, Screen, Segmented } from '@/ui';
import { useNow } from '@/platform/useNow';
import { useWakeLock } from '@/platform/useWakeLock';
import { armChime, chime } from '@/platform/chime';
import { videoOf, videoSearchUrl, videoWatchUrl } from '@/features/exercises/videos';
import { clockStart, isTap, REST_SECONDS, todaysWorkout, type Rir, type TrainingState } from '../session';
import { beatsBest, clockText, currentIndex, FEEL, lastTime, logSet, restFor, setCount, setsOf, setsWanted, skipRest, startReps, undoSet } from '../workout';

/* The workout: one exercise at a time, a big counter, how it felt, Log set. A rest clock after
   each set, with a buzz and a chime when it ends. A set that beats your best gets a moment. The
   screen stays on. A friend's cheer shows on top. */

export interface CheerLine {
  id: string;
  from: string;
  text: string;
}

type Update = (fn: (s: TrainingState) => TrainingState) => void;

export function Workout({ state, update, onFinish, onLeave, onDrop, cheer, onCheerSeen }: { state: TrainingState; update: Update; onFinish: () => void; onLeave: () => void; onDrop: () => void; cheer?: CheerLine | null; onCheerSeen?: () => void }) {
  const now = useNow();
  const workout = todaysWorkout(state);
  const at = currentIndex(state, workout);
  const q = at >= 0 ? workout[at] : null;
  const [reps, setReps] = useState(q ? startReps(state, q) : 0);
  const [feel, setFeel] = useState<Rir>('2-3');
  const [menu, setMenu] = useState(false);
  const draft = state.draft;
  const restLeft = draft?.restUntil ? Math.ceil((draft.restUntil - now.getTime()) / 1000) : 0;
  const count = setCount(state, workout);
  // How long this rest was set for, to draw how much is left.
  const [restTotal, setRestTotal] = useState(0);
  // The set just logged beat your best: its reps, shown over the rest clock.
  const [best, setBest] = useState<number | null>(null);
  const resting = useRef(false);
  useWakeLock();

  // A new exercise or set: the counter starts from where you are.
  const key = q ? `${q.id}:${setsOf(state, q.id).length}` : 'done';
  useEffect(() => {
    if (q) setReps(startReps(state, q));
    // Only when the exercise or set changes, not on every tick.
  }, [key]);

  // A cheer stays a few seconds.
  useEffect(() => {
    if (!cheer) return;
    const t = window.setTimeout(() => onCheerSeen?.(), 6000);
    return () => window.clearTimeout(t);
  }, [cheer, onCheerSeen]);

  // The last set is in: the workout is done.
  const allDone = at === -1 && count.done > 0;
  useEffect(() => {
    if (allDone) onFinish();
  }, [allDone, onFinish]);

  // The rest clock ran out: say so, and clear it. (Skipped by hand, it ends quietly.)
  useEffect(() => {
    if (!draft?.restUntil) {
      resting.current = false;
      return;
    }
    if (restLeft > 0) {
      resting.current = true;
      return;
    }
    if (resting.current) {
      navigator.vibrate?.([70, 60, 70]);
      chime();
    }
    resting.current = false;
    update(skipRest);
  }, [draft?.restUntil, restLeft, update]);

  if (!draft) return null;
  const clock = clockText(now.getTime() - clockStart(draft));

  const log = () => {
    if (!q) return;
    const tap = isTap(q);
    const lastOfAll = at === workout.length - 1 && setsOf(state, q.id).length + 1 >= setsWanted(q);
    const rest = tap || lastOfAll ? 0 : restFor(q, REST_SECONDS);
    setRestTotal(rest);
    const record = !tap && beatsBest(state, q.id, reps);
    setBest(record ? reps : null);
    navigator.vibrate?.(record ? [12, 70, 28] : 12);
    armChime();
    update((s) => logSet(s, q.id, { reps: tap ? q.reps : reps, rir: tap ? '2-3' : feel }, new Date(), rest));
  };

  const prev = (() => {
    for (let i = (at < 0 ? workout.length : at) - 1; i >= 0; i--) if (setsOf(state, workout[i].id).length) return workout[i];
    return q && setsOf(state, q.id).length ? q : null;
  })();
  const howTo = q ? videoOf(q.id) : null;
  const done = q ? setsOf(state, q.id).length : 0;
  const last = q ? lastTime(state, q.id) : null;
  const unit = q?.unit === 'sec' ? 's' : '';
  const ahead = !!q && !isTap(q) && beatsBest(state, q.id, reps);

  return (
    <Screen tabs={false} glow="left-[-15px] top-[120px]" mood={restLeft > 0 ? 'rest' : 'work'} view={restLeft > 0 ? 'rest' : (q?.id ?? 'end')}>
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Close workout" onClick={() => setMenu(true)} className="glass press flex h-11 w-11 items-center justify-center rounded-full">
          <X size={18} strokeWidth={2} aria-hidden />
        </button>
        <span className="text-[15px] tabular-nums text-ink-muted">{clock}</span>
        {q ? (
          <a href={howTo ? videoWatchUrl(howTo.id) : videoSearchUrl(q.name)} target="_blank" rel="noreferrer" aria-label="How to do it" className="glass press flex h-11 w-11 items-center justify-center rounded-full">
            <Play size={16} fill="currentColor" strokeWidth={0} aria-hidden />
          </a>
        ) : (
          <span className="w-11" />
        )}
      </div>

      {cheer && (
        <Glass className="mt-3.5 flex items-center gap-2.5 rounded-[20px] px-3.5 py-2.5" role="status">
          <Avatar name={cheer.from} size={24} />
          <span className="text-[14px] text-ink-soft">
            {cheer.from.split(' ')[0]}: {cheer.text}
          </span>
        </Glass>
      )}

      {restLeft > 0 ? (
        <div className="flex flex-1 flex-col items-center">
          <span className="mt-14 text-[15px] text-ink-muted">Rest</span>
          <Ring className="mt-6" value={restLeft / Math.max(restTotal, restLeft, 1)} flash={best !== null} label={`Rest, ${restLeft} seconds left`}>
            <span key={restLeft <= 3 ? restLeft : 'rest'} className={`num font-display text-[72px] font-normal leading-[76px] tracking-[-2.5px] ${restLeft <= 3 ? 'pop' : ''}`}>
              {clockText(restLeft * 1000)}
            </span>
            {best !== null && (
              <span className="mt-1 flex items-center gap-2 text-[13px] text-ink-soft">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-win shadow-[0_0_8px_rgba(233,184,114,0.7)]" />
                New best: {best}
                {unit}
              </span>
            )}
          </Ring>
          {q && <span className="mt-6 text-[14px] text-ink-faint">Next: {q.name}</span>}
          <Button kind="glass" className="mt-auto w-full" onClick={() => update(skipRest)}>
            Skip rest
          </Button>
        </div>
      ) : q ? (
        <>
          <span className="mt-12 text-center text-[15px] text-ink-muted">{q.name}</span>

          {isTap(q) ? (
            <div className="mt-6 flex flex-col items-center gap-5 px-4 text-center">
              <Ring of={1} done={0} label={q.name}>
                <span className="num font-display text-[72px] font-normal leading-[76px] tracking-[-2.5px]">
                  {q.reps}
                  <span className="text-[32px] text-ink-muted">{unit}</span>
                </span>
              </Ring>
              <span className="text-[14px] leading-5 text-ink-faint">{q.cue}</span>
            </div>
          ) : (
            <>
              <div className="mt-6 flex items-center justify-between">
                <button type="button" aria-label="One less" onClick={() => setReps((r) => Math.max(0, r - (q.unit === 'sec' ? 5 : 1)))} className="glass press h-[52px] w-[52px] shrink-0 rounded-full text-[24px]">
                  −
                </button>
                <Ring size={232} of={q.sets} done={done} label={`Set ${done + 1} of ${q.sets}`}>
                  <span key={reps} className={`pop num font-display text-[104px] font-normal leading-[104px] tracking-[-4px] ${ahead ? 'best-num' : ''}`}>
                    {reps}
                    {unit && <span className="text-[40px] tracking-normal text-ink-muted">{unit}</span>}
                  </span>
                  <span className={`text-[13px] ${ahead ? 'text-win-soft' : 'text-ink-faint'}`}>{ahead ? `last ${last}${unit} · +${reps - (last ?? 0)}` : last !== null ? `last ${last}${unit}` : `target ${q.reps}${unit}`}</span>
                </Ring>
                <button type="button" aria-label="One more" onClick={() => setReps((r) => r + (q.unit === 'sec' ? 5 : 1))} className="glass press h-[52px] w-[52px] shrink-0 rounded-full text-[24px]">
                  +
                </button>
              </div>
              <span className="mt-4 text-center text-[13px] text-ink-faint">
                Set {Math.min(done + 1, q.sets)} of {q.sets}
              </span>
              <div className="mt-8">
                <Segmented label="How it felt" options={FEEL} value={feel} onChange={setFeel} />
              </div>
            </>
          )}

          <div className="mt-auto flex gap-3 pt-6">
            {prev && (
              <button type="button" aria-label="Take back the last set" onClick={() => update((s) => undoSet(s, prev.id))} className="glass press flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
                <Undo2 size={18} strokeWidth={2} aria-hidden />
              </button>
            )}
            <Button className="flex-1" onClick={log}>
              {isTap(q) ? 'Done' : 'Log set'}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Ring of={1} done={1} label="All sets done">
            <Check size={44} strokeWidth={1.5} aria-hidden />
            <span className="mt-2 text-[14px] text-ink-muted">
              {count.done}/{count.of} sets
            </span>
          </Ring>
          <Button className="mt-10 w-full" onClick={onFinish}>
            Finish
          </Button>
        </div>
      )}

      {menu && (
        <div className="fade fixed inset-0 z-30 flex items-end bg-black/55 px-4 pb-8" onClick={() => setMenu(false)}>
          <Glass className="sheet mx-auto flex w-full max-w-[448px] flex-col gap-2 p-3 !bg-[#16171C]/95" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            {count.done > 0 && (
              <Button onClick={onFinish} className="w-full">
                Finish now
              </Button>
            )}
            <Button kind="glass" onClick={onLeave} className="w-full">
              Pause, finish later
            </Button>
            <Button kind="glass" onClick={onDrop} className="w-full text-ink-muted">
              Drop this workout
            </Button>
          </Glass>
        </div>
      )}
    </Screen>
  );
}
