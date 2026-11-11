'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { Chip, Screen } from '@/ui';
import { CoachOrb } from '@/ui/CoachOrb';
import type { TrainingState } from '@/features/training/session';
import { applySetup, quickAnswers } from '../setup';
import { ASKS, MANY, OPTIONS, question, reaction, type Ask } from '../setupChat';
import type { Gear, Goal, Minutes, Mode } from '../types';

/* The first open, as a short chat with the coach: six questions, each answered with a tap (a
   few taps and Done where more than one fits), so it can plan a first week right away.
   Everything else it learns from how training goes, and from the chat. */

type Line = { who: 'coach' | 'you'; text: string };

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
/** How long the coach "types" before it answers (ms). */
const TYPING = 650;

export function Setup({ update, initialName = '' }: { update: (fn: (s: TrainingState) => TrainingState) => void; initialName?: string }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(true);
  const [name, setName] = useState(initialName);
  const [modes, setModes] = useState<Mode[]>([]);
  const [goal, setGoal] = useState<Goal>('health');
  const [days, setDays] = useState(3);
  const [minutes, setMinutes] = useState<Minutes>(40);
  const [picked, setPicked] = useState<(string | number)[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => {
    later(TYPING, () => {
      setLines([{ who: 'coach', text: question('name') }]);
      setTyping(false);
    });
    const t = timers.current;
    return () => t.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [lines, typing]);

  const finish = (g: Gear[]) => {
    const now = new Date();
    let n = 0;
    const answers = quickAnswers({ modes, goal, days, minutes, gear: g.length ? g : ['none'] });
    update((s) => ({
      ...s,
      profile: { ...s.profile, onboarded: true, name: name.trim().slice(0, 24) || undefined, kit: g.includes('gym') ? 'gym' : 'home' },
      coach: applySetup(s.coach, answers, now, () => `${now.getTime().toString(36)}${(n++).toString(36)}`),
    }));
  };

  /** Your answer goes in the chat; the coach says a word back and asks the next one. */
  const answer = (ask: Ask, said: string, values: { name?: string; modes?: Mode[]; goal?: Goal; days?: number; minutes?: Minutes; gear?: Gear[] }) => {
    setLines((l) => [...l, { who: 'you', text: said }]);
    setPicked([]);
    setTyping(true);
    const next = ASKS[step + 1];
    const back = reaction(ask, values);
    later(TYPING, () => {
      setLines((l) => [...l, ...(back ? [{ who: 'coach' as const, text: back }] : []), ...(next ? [{ who: 'coach' as const, text: question(next) }] : [])]);
      if (next) {
        setTyping(false);
        setStep(step + 1);
      }
    });
    // The last answer: the coach weaves for a moment, then the app opens on the new week.
    if (!next) later(TYPING + 1500, () => finish(values.gear ?? []));
  };

  const ask = ASKS[step];
  const labels = (list: { value: string | number; label: string }[], vs: (string | number)[]) => list.filter((o) => vs.includes(o.value)).map((o) => o.label).join(', ');

  const tap = (value: string | number) => {
    if (ask === 'goal') {
      setGoal(value as Goal);
      answer(ask, labels(OPTIONS.goal, [value]), { goal: value as Goal });
    } else if (ask === 'days') {
      setDays(value as number);
      answer(ask, `${value} days`, { days: value as number });
    } else if (ask === 'minutes') {
      setMinutes(value as Minutes);
      answer(ask, `${value} min`, { minutes: value as Minutes });
    } else if (ask === 'gear') {
      setPicked((p) => (value === 'none' ? ['none'] : toggle(p.filter((x) => x !== 'none'), value)));
    } else {
      setPicked((p) => toggle(p, value));
    }
  };

  const done = () => {
    if (ask === 'modes') {
      const m = picked as Mode[];
      setModes(m);
      answer(ask, labels(OPTIONS.modes, m), { modes: m });
    } else if (ask === 'gear') {
      const g = picked as Gear[];
      answer(ask, labels(OPTIONS.gear, g), { gear: g });
    }
  };

  const sendName = () => {
    const n = name.trim().slice(0, 24);
    if (!n) return;
    setName(n);
    answer('name', n, { name: n });
  };

  const options: { value: string | number; label: string }[] = ask === 'name' ? [] : OPTIONS[ask];

  return (
    <Screen tabs={false} fit glow="-right-40 top-24">
      <div className="flex items-center gap-3 pb-3">
        <CoachOrb mode={typing ? 'thinking' : 'idle'} size={32} label="Coach" />
        <span className="font-display text-[17px] font-medium">Coach</span>
        <div className="ml-auto flex gap-1.5" aria-label={`Question ${step + 1} of ${ASKS.length}`}>
          {ASKS.map((_, i) => (
            <span key={i} className={`h-1 w-4 rounded-full transition-colors duration-500 ${i <= step ? 'bg-ink' : 'bg-white/[0.14]'}`} />
          ))}
        </div>
      </div>

      <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-4 pt-6">
        {lines.map((l, i) =>
          l.who === 'you' ? (
            <div key={i} className="rise ml-12 self-end rounded-[20px] rounded-br-md bg-white/[0.12] px-4 py-3 text-[15px] leading-[21px]">
              {l.text}
            </div>
          ) : (
            <div key={i} className="rise glass mr-10 self-start rounded-[20px] rounded-bl-md px-4 py-3 text-[16px] leading-[22px] text-ink">
              {l.text}
            </div>
          ),
        )}
        {typing && (
          <div className="fade flex items-center gap-1.5 self-start rounded-[20px] rounded-bl-md px-1 py-2" aria-label="Coach is typing">
            {[0, 1, 2].map((d) => (
              <span key={d} className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-muted" style={{ animationDelay: `${d * 160}ms` }} />
            ))}
          </div>
        )}
        <div ref={end} />
      </div>

      {!typing && ask && (
        <div key={ask} className="rise flex flex-col gap-2.5">
          {ask === 'name' ? (
            <form
              className="glass flex h-14 items-center gap-1 rounded-[28px] pl-5 pr-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                sendName();
              }}
            >
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="Your name" aria-label="Your name" className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-faint" />
              <button type="submit" aria-label="Send" disabled={!name.trim()} className="press btn-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base disabled:opacity-40">
                <ArrowUp size={19} strokeWidth={2.2} aria-hidden />
              </button>
            </form>
          ) : (
            <>
              <div className="flex flex-wrap justify-end gap-2">
                {options.map((o) => (
                  <Chip key={o.value} on={MANY[ask] && picked.includes(o.value)} onClick={() => tap(o.value)} className={ask === 'days' ? 'w-14 px-0' : ''}>
                    {o.label}
                  </Chip>
                ))}
              </div>
              {MANY[ask] && (
                <button type="button" disabled={!picked.length} onClick={done} className="press btn-primary h-12 rounded-pill text-[16px] font-medium text-base transition-opacity disabled:opacity-0">
                  Done
                </button>
              )}
            </>
          )}
        </div>
      )}
    </Screen>
  );
}
