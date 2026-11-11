'use client';

import { useEffect, useState } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { CoachOrb, type OrbMode } from '@/ui/CoachOrb';

/* Talking with the coach by voice, as a mockup: the weave listens, works through its tools, and
   talks, with what is said written under it. A short made-up exchange plays on a loop; no
   microphone is used yet. */

type Beat = { mode: OrbMode; ms: number; you?: string; step?: string; coach?: string };

const SCRIPT: Beat[] = [
  { mode: 'listening', ms: 2600, you: 'How did my week go?' },
  { mode: 'thinking', ms: 1700, step: 'Reading your workouts' },
  { mode: 'thinking', ms: 1700, step: 'Reading your week' },
  { mode: 'talking', ms: 5200, coach: 'Three workouts, all done. Your pulls went up again. Want Thursday to lean a bit more on legs?' },
  { mode: 'listening', ms: 2200, you: 'Yes, more legs.' },
  { mode: 'thinking', ms: 1700, step: 'Checking the playbook' },
  { mode: 'thinking', ms: 1700, step: 'Building the workout' },
  { mode: 'talking', ms: 4400, coach: 'Done. Thursday has split squats now, and the pulls stay as they are.' },
];

export function Voice({ onClose }: { onClose: () => void }) {
  const [beat, setBeat] = useState(0);
  const [since, setSince] = useState(0);
  const [muted, setMuted] = useState(false);
  const b = SCRIPT[beat];

  useEffect(() => {
    if (muted) return;
    const t0 = performance.now();
    const tick = window.setInterval(() => setSince(performance.now() - t0), 80);
    const next = window.setTimeout(() => {
      setBeat((n) => (n + 1) % SCRIPT.length);
      setSince(0);
    }, b.ms);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(next);
    };
  }, [beat, muted, b.ms]);

  // The words come in as they are said: yours a little ahead of the beat, the coach's at its pace.
  const words = (b.you ?? b.coach ?? '').split(' ');
  const shown = b.you ? Math.ceil((since / (b.ms * 0.6)) * words.length) : Math.ceil((since / (b.ms * 0.85)) * words.length);
  const mode: OrbMode = muted ? 'idle' : b.mode;

  return (
    <div className="fade fixed inset-0 z-50 bg-base">
      <span className="intro-light pointer-events-none absolute left-1/2 top-[40%] h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <div className="sheet relative mx-auto flex h-[100dvh] max-w-[480px] flex-col items-center px-6" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)' }}>
        <span className="text-[13px] text-ink-muted">Coach</span>
        <div className="flex flex-1 flex-col items-center justify-center">
          <CoachOrb mode={mode} size={188} label="Coach" />
          <div className="mt-12 flex h-6 items-center">
            <span key={muted ? 'm' : b.step ?? b.mode} className="fade text-[14px] text-ink-muted">
              {muted ? 'Muted' : b.step ? `${b.step}…` : b.mode === 'listening' ? 'Listening' : ''}
            </span>
          </div>
          <p className={`mt-3 min-h-[96px] max-w-[320px] text-center font-display text-[22px] font-medium leading-[30px] tracking-[-0.3px] ${b.you ? 'text-ink-soft' : 'text-ink'}`}>
            {!muted && b.mode !== 'thinking'
              ? words.map((w, i) => (
                  <span key={`${beat}-${i}`} className={`transition-opacity duration-300 ${i < shown ? 'opacity-100' : 'opacity-0'}`}>
                    {w}{' '}
                  </span>
                ))
              : null}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <button type="button" aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted((m) => !m)} className="glass press flex h-16 w-16 items-center justify-center rounded-full text-ink">
            {muted ? <MicOff size={22} strokeWidth={1.8} aria-hidden /> : <Mic size={22} strokeWidth={1.8} aria-hidden />}
          </button>
          <button type="button" aria-label="End" onClick={onClose} className="press btn-primary flex h-16 w-16 items-center justify-center rounded-full text-base">
            <X size={22} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
