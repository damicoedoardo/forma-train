'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button, Chip, Glass, Segmented } from '@/ui';
import { cloudConfigured } from '@/platform/api';
import { dayKey } from '@/features/training/days';
import { sessionsThisWeek, WEEKLY_GOAL, type TrainingState } from '@/features/training/session';
import { shownChat } from '../chat';
import { freshNudge, hearNudge } from '../nudge';
import { minutesOf } from '../validate';
import { daysIn, restKept, weekSlots, weekTally, weekdayOf } from '../week';
import { useCoachChat } from './useCoach';
import { shortTitle } from '../title';

/* The Coach tab: the week it planned, and the chat. */

type View = 'week' | 'chat';
type Update = (fn: (s: TrainingState) => TrainingState) => void;

export function CoachTab({ state, update, signedIn, now, onSignIn }: { state: TrainingState; update: Update; signedIn: boolean; now: Date; onSignIn: () => void }) {
  const [view, setView] = useState<View>('chat');
  return (
    <>
      <div className="mx-auto w-[200px]">
        <Segmented
          label="Coach"
          options={[
            { value: 'week', label: 'Week' },
            { value: 'chat', label: 'Chat' },
          ]}
          value={view}
          onChange={setView}
        />
      </div>
      {view === 'week' ? <Week state={state} now={now} /> : <Chat state={state} update={update} signedIn={signedIn} now={now} onSignIn={onSignIn} onWeek={() => setView('week')} />}
    </>
  );
}

function Week({ state, now }: { state: TrainingState; now: Date }) {
  const week = state.coach?.week;
  const today = dayKey(now);
  const tally = weekTally(week, now, sessionsThisWeek(state, now), WEEKLY_GOAL);
  const next = week ? daysIn(week, 1) : [];
  return (
    <>
      <div className="mt-8 flex items-baseline justify-between px-1">
        <h1 className="font-display text-[28px] font-medium tracking-[-0.6px]">This week</h1>
        <span className="text-[15px] tabular-nums text-ink-muted">
          {tally.done} / {tally.goal}
        </span>
      </div>
      {week ? (
        <Glass className="mt-4 flex flex-col px-5 py-1.5">
          {weekSlots(week, 0).map((s, i) => {
            const done = !!s.day?.done;
            const isToday = s.date === today;
            return (
              <div key={s.date} className={`flex items-center gap-4 py-3.5 ${i ? 'border-t hairline' : ''}`}>
                <span className={`w-9 text-[14px] ${isToday ? 'text-ink' : 'text-ink-muted'}`}>{weekdayOf(s.date)}</span>
                <span className={`flex-1 text-[15px] ${s.day ? '' : 'text-ink-faint'}`}>{s.day ? shortTitle(s.day.plan.title) : restKept(state, s.date) ? 'Rested' : 'Rest'}</span>
                {s.day && <span className="text-[14px] tabular-nums text-ink-muted">{minutesOf(s.day.plan.items)}m</span>}
                <span aria-label={done ? 'Done' : undefined} className={`h-2.5 w-2.5 rounded-full ${done ? 'bg-ink' : isToday && s.day ? 'bg-accent shadow-[0_0_8px_rgba(110,116,240,0.6)]' : s.day ? 'border border-white/25' : ''}`} />
              </div>
            );
          })}
        </Glass>
      ) : (
        <Glass className="mt-4 px-5 py-5 text-[15px] text-ink-muted">The week shows here once it is planned.</Glass>
      )}
      {next.length > 0 && (
        <Glass className="mt-3 flex items-center justify-between rounded-[20px] px-5 py-4">
          <span className="text-[15px] text-ink-muted">Next week</span>
          <span className="text-[15px]">{next.map((d) => weekdayOf(d.date)).join(' · ')}</span>
        </Glass>
      )}
    </>
  );
}

function Chat({ state, update, signedIn, now, onSignIn, onWeek }: { state: TrainingState; update: Update; signedIn: boolean; now: Date; onSignIn: () => void; onWeek: () => void }) {
  const { send, busy, error, steps } = useCoachChat(state, update);
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const lines = shownChat(state.coach?.chat);
  const replies = state.coach?.replies ?? [];
  const week = state.coach?.week;

  // Opening the chat: the coach's line from Today is said here, or the coach opens an empty chat.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    const nudge = freshNudge(state, now);
    const empty = !state.coach?.chat?.length;
    if (nudge) update((s) => hearNudge(s, nudge, !(empty && signedIn)));
    if (empty && signedIn) void send();
  }, [state, now, update, signedIn, send]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [lines.length, busy]);

  const say = (t: string) => {
    const v = t.trim();
    if (!v || busy) return;
    setText('');
    void send(v);
  };

  return (
    <>
      <div className="mt-6 flex flex-1 flex-col gap-3 overflow-y-auto pb-4">
        {lines.map((l) =>
          l.who === 'workout' ? (
            week ? (
              <button key={l.key} type="button" onClick={onWeek} className="glass mr-10 flex flex-col gap-2 rounded-[20px] px-4 py-3.5 text-left">
                {daysIn(week, week.days.some((d) => !d.done && d.date >= dayKey(now)) ? 0 : 1)
                  .filter((d) => !d.done)
                  .slice(0, 3)
                  .map((d) => (
                    <div key={d.date} className="flex justify-between text-[14px]">
                      <span>
                        {weekdayOf(d.date)} · {shortTitle(d.plan.title)}
                      </span>
                      <span className="text-ink-muted">{minutesOf(d.plan.items)}m</span>
                    </div>
                  ))}
              </button>
            ) : null
          ) : l.who === 'you' ? (
            <div key={l.key} className="ml-12 self-end rounded-[20px] rounded-br-md bg-white/[0.12] px-4 py-3 text-[15px] leading-[21px]">
              {l.text}
            </div>
          ) : (
            <div key={l.key} className="glass mr-10 self-start rounded-[20px] rounded-bl-md px-4 py-3 text-[15px] leading-[21px] text-ink-soft">
              {l.text}
            </div>
          ),
        )}
        {busy && <div className="self-start px-2 text-[13px] text-ink-faint">{steps.at(-1) ?? 'Thinking'}…</div>}
        {error && <div className="self-start px-2 text-[13px] text-ink-muted">{error}</div>}
        {!signedIn && (
          <Glass className="flex flex-col gap-4 px-5 py-5">
            <span className="text-[15px] leading-[21px] text-ink-soft">{cloudConfigured ? 'Sign in to talk with your coach. Your week is planned either way.' : 'Talking with the coach comes soon. Your week is planned either way.'}</span>
            {cloudConfigured && (
              <Button kind="glass" onClick={onSignIn}>
                Sign in
              </Button>
            )}
          </Glass>
        )}
        <div ref={end} />
      </div>

      {signedIn && (
        <div className="flex flex-col gap-2.5">
          {replies.length > 0 && !busy && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
              {replies.map((r) => (
                <Chip key={r} onClick={() => say(r)}>
                  {r}
                </Chip>
              ))}
            </div>
          )}
          <form
            className="glass flex h-14 items-center gap-2 rounded-pill pl-5 pr-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              say(text);
            }}
          >
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message" aria-label="Message" maxLength={1000} className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-faint" />
            <button type="submit" aria-label="Send" disabled={!text.trim() || busy} className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-base disabled:opacity-30">
              <ArrowUp size={18} strokeWidth={2.2} aria-hidden />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
