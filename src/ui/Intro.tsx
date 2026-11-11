'use client';

import { useEffect, useState } from 'react';

/* The opening screen: on each launch the weave draws itself in, one part after another, in a
   soft light; the name rises in under it; then it all lifts away to the app. Once a launch (kept
   in sessionStorage). A tap skips it; under reduced motion it is only a short fade. */

const R = 32;
const at = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${(50 + R * Math.cos(a)).toFixed(2)} ${(50 + R * Math.sin(a)).toFixed(2)}`;
};
const arc = (from: number, sweep: number) => `M${at(from)}A${R} ${R} 0 0 1 ${at(from + sweep)}`;
const PARTS = [0, 1, 2, 3, 4];
const KEY = 'forma-intro';
/** When it starts to lift away, and when it is gone (ms). */
const LEAVE = 2300;
const GONE = 2950;

export function Intro() {
  const [phase, setPhase] = useState<'on' | 'leaving' | 'gone'>('on');

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === '1';
      sessionStorage.setItem(KEY, '1');
    } catch {
      // No storage: show it anyway.
    }
    if (seen) {
      setPhase('gone');
      return;
    }
    const quick = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const a = window.setTimeout(() => setPhase('leaving'), quick ? 500 : LEAVE);
    const b = window.setTimeout(() => setPhase('gone'), quick ? 900 : GONE);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  if (phase === 'gone') return null;
  return (
    <div
      aria-hidden
      onClick={() => setPhase('gone')}
      className={`intro fixed inset-0 z-[100] flex flex-col items-center justify-center bg-base ${phase === 'leaving' ? 'intro-leave' : ''}`}
    >
      <span className="intro-light pointer-events-none absolute left-1/2 top-1/2 h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <div className="intro-lift relative flex flex-col items-center">
        <svg width="96" height="96" viewBox="0 0 100 100" className="overflow-visible">
          <defs>
            {PARTS.map((i) => (
              // A part is cut where the next one starts, so the next reads as lying over it.
              <mask key={i} id={`intro-${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
                <rect width="100" height="100" fill="#fff" />
                <path d={arc(-126 + 72 * (i + 1), 20)} fill="none" stroke="#000" strokeWidth="18" strokeLinecap="round" />
              </mask>
            ))}
          </defs>
          <g style={{ filter: 'drop-shadow(0 0 6px rgba(140,132,243,0.45))' }}>
            {PARTS.map((i) => (
              <g key={i} mask={`url(#intro-${i})`}>
                <path
                  d={arc(-126 + 72 * i, 76)}
                  pathLength={1}
                  className="intro-part"
                  style={{ animationDelay: `${180 + (4 - i) * 130}ms` }}
                  fill="none"
                  stroke={i === 3 ? '#8C84F3' : '#ECECEF'}
                  strokeWidth="13"
                  strokeLinecap="round"
                />
              </g>
            ))}
          </g>
        </svg>
        <span className="mt-7 flex font-display text-[30px] font-medium tracking-[-0.8px] text-ink">
          {'Forma'.split('').map((c, i) => (
            <span key={i} className="intro-letter" style={{ animationDelay: `${1000 + i * 55}ms` }}>
              {c}
            </span>
          ))}
        </span>
        <span className="intro-rule mt-5 h-px w-16" />
      </div>
    </div>
  );
}
