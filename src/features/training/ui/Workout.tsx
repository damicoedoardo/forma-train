'use client';

import { useEffect, useState } from 'react';
import { Check, Play, Undo2, X } from 'lucide-react';
import { Avatar, Button, Glass, Screen, Segmented } from '@/ui';
import { useNow } from '@/platform/useNow';
import { videoOf, videoSearchUrl, videoWatchUrl } from '@/features/exercises/videos';
import { clockStart, isTap, REST_SECONDS, todaysWorkout, type Rir, type TrainingState } from '../session';
import { clockText, currentIndex, FEEL, lastTime, logSet, restFor, setCount, setsOf, setsWanted, skipRest, startReps, undoSet } from '../workout';

/* The workout: one exercise at a time, a big counter, how it felt, Log set. A rest clock after
   each set. A friend's cheer shows on top. */

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

  // The rest clock ran out: clear it.
  useEffect(() => {
    if (draft?.restUntil && restLeft <= 0) update(skipRest);
  }, [draft?.restUntil, restLeft, update]);

  if (!draft) return null;
  const clock = clockText(now.getTime() - clockStart(draft));

  const log = () => {
    if (!q) return;
    const tap = isTap(q);
    const lastOfAll = at === workout.length - 1 && setsOf(state, q.id).length + 1 >= setsWanted(q);
    update((s) => logSet(s, q.id, { reps: tap ? q.reps : reps, rir: tap ? '2-3' : feel }, new Date(), tap || lastOfAll ? 0 : restFor(q, REST_SECONDS)));
  };

  const prev = (() => {
    for (let i = (at < 0 ? workout.length : at) - 1; i >= 0; i--) if (setsOf(state, workout[i].id).length) return workout[i];
    return q && setsOf(state, q.id).length ? q : null;
  })();
  const howTo = q ? videoOf(q.id) : null;
  const done = q ? setsOf(state, q.id).length : 0;
  const last = q ? lastTime(state, q.id) : null;
  const unit = q?.unit === 'sec' ? 's' : '';

  return (
    <Screen tabs={false} glow="left-[15px] top-[250px] !opacity-[0.15]">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Close workout" onClick={() => setMenu(true)} className="glass flex h-11 w-11 items-center justify-center rounded-full">
          <X size={18} strokeWidth={2} aria-hidden />
        </button>
        <span className="text-[15px] tabular-nums text-ink-muted">{clock}</span>
        {q ? (
          <a href={howTo ? videoWatchUrl(howTo.id) : videoSearchUrl(q.name)} target="_blank" rel="noreferrer" aria-label="How to do it" className="glass flex h-11 w-11 items-center justify-center rounded-full">
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
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <span className="text-[15px] text-ink-muted">Rest</span>
          <span className="font-display text-[112px] font-normal leading-[116px] tracking-[-4px] tabular-nums">{clockText(restLeft * 1000)}</span>
          {q && <span className="text-[14px] text-ink-faint">Next: {q.name}</span>}
          <Button kind="glass" className="mt-10 w-full" onClick={() => update(skipRest)}>
            Skip rest
          </Button>
        </div>
      ) : q ? (
        <>
          <div className="mt-14 flex flex-col items-center gap-2.5">
            <span className="text-[15px] text-ink-muted">{q.name}</span>
            {!isTap(q) && (
              <div className="flex gap-1.5" aria-label={`Set ${done + 1} of ${q.sets}`}>
                {Array.from({ length: q.sets }, (_, i) => (
                  <span key={i} className={`h-1 w-7 rounded-full ${i < done ? 'bg-ink' : i === done ? 'bg-accent shadow-[0_0_8px_rgba(110,116,240,0.6)]' : 'bg-white/[0.14]'}`} />
                ))}
              </div>
            )}
          </div>

          {isTap(q) ? (
            <div className="mt-8 flex flex-col items-center gap-3 px-4 text-center">
              <span className="font-display text-[72px] font-normal leading-[80px] tracking-[-2px] tabular-nums">
                {q.reps}
                {unit}
              </span>
              <span className="text-[14px] leading-5 text-ink-faint">{q.cue}</span>
            </div>
          ) : (
            <>
              <div className="mt-7 flex items-center justify-between px-2">
                <button type="button" aria-label="One less" onClick={() => setReps((r) => Math.max(0, r - (q.unit === 'sec' ? 5 : 1)))} className="glass h-[60px] w-[60px] rounded-full text-[26px]">
                  −
                </button>
                <span className="font-display text-[112px] font-normal leading-[116px] tracking-[-4px] tabular-nums">
                  {reps}
                  {unit && <span className="text-[48px] text-ink-muted">{unit}</span>}
                </span>
                <button type="button" aria-label="One more" onClick={() => setReps((r) => r + (q.unit === 'sec' ? 5 : 1))} className="glass h-[60px] w-[60px] rounded-full text-[26px]">
                  +
                </button>
              </div>
              <span className="text-center text-[14px] text-ink-faint">{last !== null ? `last time ${last}${unit}` : `target ${q.reps}${unit}`}</span>
              <div className="mt-11">
                <Segmented label="How it felt" options={FEEL} value={feel} onChange={setFeel} />
              </div>
            </>
          )}

          <div className="mt-auto flex gap-3 pt-6">
            {prev && (
              <button type="button" aria-label="Take back the last set" onClick={() => update((s) => undoSet(s, prev.id))} className="glass flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
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
          <Check size={40} strokeWidth={1.6} aria-hidden />
          <span className="text-[15px] text-ink-muted">
            {count.done}/{count.of} sets
          </span>
          <Button className="mt-10 w-full" onClick={onFinish}>
            Finish
          </Button>
        </div>
      )}

      {menu && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/50 px-4 pb-8" onClick={() => setMenu(false)}>
          <Glass className="mx-auto flex w-full max-w-[448px] flex-col gap-2 p-3 !bg-[#16171C]/90" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
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
