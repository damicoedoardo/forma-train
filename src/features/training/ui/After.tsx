'use client';

import { useState } from 'react';
import { Button, Ring, Segmented, Stats } from '@/ui';
import { weekTally } from '@/features/coach/week';
import { sessionsThisWeek, WEEKLY_GOAL, type Session, type TrainingState } from '../session';
import { clockText } from '../workout';
import { shortTitle } from '@/features/coach/title';

/* After a workout: how long, the sets, records and the week, what went up, how it felt. Share
   puts it in the friends' feed. */

type Felt = NonNullable<Session['felt']>;
const FELT: { value: Felt; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'right', label: 'Good' },
  { value: 'hard', label: 'Too much' },
];

export function After({ state, session, title, startedAt, update, onDone, onShare }: { state: TrainingState; session: Session; title: string; startedAt: string; update: (fn: (s: TrainingState) => TrainingState) => void; onDone: () => void; onShare?: () => Promise<void> }) {
  const [shared, setShared] = useState<'no' | 'busy' | 'yes' | 'failed'>('no');
  const now = new Date();
  const took = new Date(session.date).getTime() - new Date(startedAt).getTime();
  const done = session.entries.filter((e) => e.of).reduce((a, e) => a + e.sets.length, 0);
  const of = session.entries.reduce((a, e) => a + (e.of ?? 0), 0);
  const tally = weekTally(state.coach?.week, now, sessionsThisWeek(state, now), WEEKLY_GOAL);
  const up = [...(session.raised ?? []), ...(session.heavier ?? [])];
  const felt = state.sessions.find((s) => s.id === session.id)?.felt ?? null;

  const setFelt = (f: Felt) => update((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id === session.id ? { ...x, felt: f } : x)) }));
  const share = async () => {
    if (!onShare) return;
    setShared('busy');
    try {
      await onShare();
      setShared('yes');
    } catch {
      setShared('failed');
    }
  };

  return (
    <>
      <div className="mt-4 flex flex-col items-center gap-5">
        <span className="text-[15px] text-ink-muted">{shortTitle(title)} · done</span>
        <Ring size={216} value={of ? done / of : 1} tone="ink" label={`${done} of ${of} sets`}>
          <span className="num font-display text-[56px] font-normal leading-[60px] tracking-[-2px]">{clockText(Math.max(0, took))}</span>
          <span className="text-[13px] text-ink-faint">time</span>
        </Ring>
      </div>

      <div className="mt-8">
        <Stats
          items={[
            { value: `${done}/${of}`, label: 'sets' },
            { value: session.better ? 1 : 0, label: 'records' },
            { value: `${tally.done}/${tally.goal}`, label: 'this week' },
          ]}
        />
      </div>

      {up.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {up.slice(0, 4).map((id) => {
            const e = session.entries.find((x) => x.exerciseId === id);
            const heavier = session.heavier?.includes(id);
            return (
              <span key={id} className="glass flex h-9 items-center gap-1.5 rounded-pill px-3.5 text-[14px] text-ink-soft">
                {e?.name ?? id} <span className="text-win">{heavier ? '+kg' : '↑'}</span>
              </span>
            );
          })}
        </div>
      )}

      <span className="mt-8 px-1 text-[15px] text-ink-muted">How was it?</span>
      <div className="mt-3">
        <Segmented label="How was it" options={FELT} value={felt} onChange={setFelt} />
      </div>

      <div className="mt-auto flex gap-3 pt-6">
        {onShare && (
          <Button kind="glass" className="flex-1" disabled={shared === 'busy' || shared === 'yes'} onClick={share}>
            {shared === 'yes' ? 'Shared' : shared === 'failed' ? 'Try again' : 'Share'}
          </Button>
        )}
        <Button className="flex-1" onClick={onDone}>
          Done
        </Button>
      </div>
    </>
  );
}

