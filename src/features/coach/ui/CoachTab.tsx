'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, Check, Mic, X } from 'lucide-react';
import { Button, Chip, Glass } from '@/ui';
import { CoachOrb } from '@/ui/CoachOrb';
import { cloudConfigured } from '@/platform/api';
import { dayKey } from '@/features/training/days';
import type { TrainingState } from '@/features/training/session';
import { shownChat } from '../chat';
import { freshNudge, hearNudge } from '../nudge';
import { minutesOf } from '../validate';
import { daysIn, weekdayOf } from '../week';
import { useCoachChat } from './useCoach';
import { shortTitle } from '../title';
import { demoAsk } from './demo';
import { useDictation } from './useDictation';

/* The Coach tab: the chat. The week lives on Today. With `?demo` in the address the chat runs on a
   made-up coach (`demo.ts`). */

type Update = (fn: (s: TrainingState) => TrainingState) => void;

export function CoachTab({ state, update, signedIn, now, onSignIn, onWeek }: { state: TrainingState; update: Update; signedIn: boolean; now: Date; onSignIn: () => void; onWeek: () => void }) {
  return <Chat state={state} update={update} signedIn={signedIn} now={now} onSignIn={onSignIn} onWeek={onWeek} />;
}

function Chat({ state, update, signedIn: real, now, onSignIn, onWeek }: { state: TrainingState; update: Update; signedIn: boolean; now: Date; onSignIn: () => void; onWeek: () => void }) {
  const [demo] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo'));
  const signedIn = real || demo;
  const { send, busy, error, steps } = useCoachChat(state, update, demo ? demoAsk : undefined);
  const [text, setText] = useState('');
  const input = useRef<HTMLTextAreaElement>(null);
  // Dictation: the words land after anything already typed, to edit or send.
  const dictation = useDictation((words) => {
    setText((t) => (t.trim() ? `${t.trimEnd()} ${words}` : words).slice(0, 1000));
    input.current?.focus();
  });
  const talking = dictation.state !== 'idle';
  // The box grows with what is in it, up to five lines.
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text, talking]);
  const list = useRef<HTMLDivElement>(null);
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

  // The newest line stays in sight: on a new line, and as the keyboard comes up. Only the list
  // scrolls, never the page, so nothing jumps.
  const toEnd = useCallback(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);
  useEffect(toEnd, [lines.length, busy, toEnd]);
  useEffect(() => {
    const vv = window.visualViewport;
    vv?.addEventListener('resize', toEnd);
    return () => vv?.removeEventListener('resize', toEnd);
  }, [toEnd]);

  const say = (t: string) => {
    const v = t.trim();
    if (!v || busy) return;
    setText('');
    void send(v);
  };

  return (
    <>
      <div className="flex items-center gap-2.5 px-1">
        <CoachOrb mode={busy ? 'thinking' : 'idle'} size={28} label="Coach" />
        <span className="font-display text-[17px] font-medium">Coach</span>
      </div>
      <div ref={list} className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
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
        {busy && (
          <div className="flex items-center gap-3 self-start pl-1">
            <CoachOrb mode="thinking" size={30} label="Working" />
            <span key={steps.length} className="fade text-[14px] text-ink-muted">
              {steps.at(-1) ?? 'Thinking'}…
            </span>
          </div>
        )}
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
          {dictation.error && <span className="px-2 text-[13px] text-ink-muted">{dictation.error}</span>}
          <form
            className="glass flex min-h-14 items-end gap-1 rounded-[28px] py-1.5 pl-5 pr-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!talking) say(text);
            }}
          >
            {dictation.state === 'recording' ? (
              <>
                <button type="button" aria-label="Cancel" onClick={dictation.cancel} className="press -ml-3.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted">
                  <X size={19} strokeWidth={2} aria-hidden />
                </button>
                <div aria-hidden className="flex h-8 min-w-0 flex-1 self-center items-center justify-end gap-[3px] overflow-hidden">
                  {dictation.bars.map((l, i) => (
                    <span key={i} className="w-[3px] shrink-0 rounded-full bg-ink/80 transition-[height] duration-75" style={{ height: `${3 + Math.round(l * 26)}px` }} />
                  ))}
                </div>
                <span className="w-12 shrink-0 self-center text-center text-[14px] tabular-nums text-ink-muted">
                  {Math.floor(dictation.seconds / 60)}:{String(dictation.seconds % 60).padStart(2, '0')}
                </span>
                <button type="button" aria-label="Done" onClick={dictation.stop} className="flex h-11 w-11 shrink-0 items-center justify-center press btn-primary rounded-full text-base">
                  <Check size={19} strokeWidth={2.2} aria-hidden />
                </button>
              </>
            ) : (
              <>
                {dictation.state === 'transcribing' ? (
                  <span className="writing min-w-0 flex-1 self-center text-[16px] text-ink-muted">Writing it down…</span>
                ) : (
                  <textarea
                    ref={input}
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        say(text);
                      }
                    }}
                    placeholder="Message"
                    aria-label="Message"
                    maxLength={1000}
                    className="max-h-[120px] min-w-0 flex-1 resize-none self-center bg-transparent py-1 text-[16px] leading-[22px] text-ink outline-none placeholder:text-ink-faint"
                  />
                )}
                {dictation.available && (
                  <button type="button" aria-label="Talk" onClick={() => void dictation.start()} disabled={talking} className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft disabled:opacity-40">
                    <Mic size={20} strokeWidth={1.9} aria-hidden />
                  </button>
                )}
                {/* Tapping send keeps the focus in the box, so the keyboard stays up, like a chat app. */}
                <button type="submit" aria-label="Send" onPointerDown={(e) => e.preventDefault()} disabled={!text.trim() || busy || talking} className="flex h-11 w-11 shrink-0 items-center justify-center press btn-primary rounded-full text-base disabled:opacity-30">
                  <ArrowUp size={18} strokeWidth={2.2} aria-hidden />
                </button>
              </>
            )}
          </form>
        </div>
      )}
    </>
  );
}
