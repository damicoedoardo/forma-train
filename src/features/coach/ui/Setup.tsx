'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button, Chip, Screen } from '@/ui';
import type { TrainingState } from '@/features/training/session';
import { applySetup, quickAnswers } from '../setup';
import type { Gear, Goal, Minutes, Mode } from '../types';

/* The first open: six short questions, one a screen, so the coach can plan a first week right
   away. Everything else it learns from how training goes, and from the chat. */

const MODES: { value: Mode; label: string }[] = [
  { value: 'gym', label: 'Gym' },
  { value: 'calisthenics', label: 'Calisthenics' },
  { value: 'running', label: 'Running' },
];
const GOALS: { value: Goal; label: string }[] = [
  { value: 'health', label: 'Feel good' },
  { value: 'strength', label: 'Get stronger' },
  { value: 'muscle', label: 'Build muscle' },
  { value: 'endurance', label: 'Go longer' },
  { value: 'skill', label: 'Learn a skill' },
];
const GEAR: { value: Gear; label: string }[] = [
  { value: 'gym', label: 'A gym' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'bar', label: 'A pull-up bar' },
  { value: 'bands', label: 'Bands' },
  { value: 'none', label: 'Nothing' },
];
const DAYS = [2, 3, 4, 5, 6];
const MINUTES: Minutes[] = [20, 30, 40, 60];

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function Setup({ update, initialName = '' }: { update: (fn: (s: TrainingState) => TrainingState) => void; initialName?: string }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [modes, setModes] = useState<Mode[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [days, setDays] = useState(3);
  const [minutes, setMinutes] = useState<Minutes>(40);
  const [gear, setGear] = useState<Gear[]>([]);

  const finish = () => {
    const now = new Date();
    let n = 0;
    const answers = quickAnswers({ modes, goal: goal ?? 'health', days, minutes, gear: gear.length ? gear : ['none'] });
    update((s) => ({
      ...s,
      profile: { ...s.profile, onboarded: true, name: name.trim().slice(0, 24) || undefined, kit: gear.includes('gym') ? 'gym' : 'home' },
      coach: applySetup(s.coach, answers, now, () => `${now.getTime().toString(36)}${(n++).toString(36)}`),
    }));
  };

  const steps = [
    {
      q: 'What should I call you?',
      ok: name.trim().length > 0,
      body: (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          placeholder="Your name"
          aria-label="Your name"
          className="glass h-14 w-full rounded-[20px] bg-transparent px-5 text-[17px] text-ink outline-none placeholder:text-ink-faint"
        />
      ),
    },
    {
      q: 'What do you train?',
      ok: modes.length > 0,
      body: (
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <Chip key={m.value} on={modes.includes(m.value)} onClick={() => setModes(toggle(modes, m.value))}>
              {m.label}
            </Chip>
          ))}
        </div>
      ),
    },
    {
      q: 'What for, mostly?',
      ok: !!goal,
      body: (
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <Chip key={g.value} on={goal === g.value} onClick={() => setGoal(g.value)}>
              {g.label}
            </Chip>
          ))}
        </div>
      ),
    },
    {
      q: 'Days a week?',
      ok: true,
      body: (
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <Chip key={d} on={days === d} onClick={() => setDays(d)} className="w-14 px-0">
              {d}
            </Chip>
          ))}
        </div>
      ),
    },
    {
      q: 'How long each time?',
      ok: true,
      body: (
        <div className="flex flex-wrap gap-2">
          {MINUTES.map((m) => (
            <Chip key={m} on={minutes === m} onClick={() => setMinutes(m)}>
              {m} min
            </Chip>
          ))}
        </div>
      ),
    },
    {
      q: 'What do you have?',
      ok: gear.length > 0,
      body: (
        <div className="flex flex-wrap gap-2">
          {GEAR.map((g) => (
            <Chip key={g.value} on={gear.includes(g.value)} onClick={() => setGear(g.value === 'none' ? ['none'] : toggle(gear.filter((x) => x !== 'none'), g.value))}>
              {g.label}
            </Chip>
          ))}
        </div>
      ),
    },
  ];
  const cur = steps[step];
  const last = step === steps.length - 1;

  return (
    <Screen tabs={false} glow="-right-40 top-24">
      <div className="flex h-11 items-center justify-between">
        {step > 0 ? (
          <button type="button" aria-label="Back" onClick={() => setStep(step - 1)} className="glass flex h-11 w-11 items-center justify-center rounded-full">
            <ArrowLeft size={18} strokeWidth={2} aria-hidden />
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-1.5" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((_, i) => (
            <span key={i} className={`h-1 w-5 rounded-full ${i <= step ? 'bg-ink' : 'bg-white/[0.14]'}`} />
          ))}
        </div>
        <span className="w-11" />
      </div>
      <h1 className="mt-16 font-display text-[34px] font-medium leading-[40px] tracking-[-1px]">{cur.q}</h1>
      <div className="mt-8">{cur.body}</div>
      <Button className="mt-auto w-full" disabled={!cur.ok} onClick={() => (last ? finish() : setStep(step + 1))}>
        {last ? 'Plan my week' : 'Continue'}
      </Button>
    </Screen>
  );
}
