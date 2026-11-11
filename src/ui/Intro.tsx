'use client';

import { useEffect, useState } from 'react';

/* The opening screen: on each launch the weave draws itself in counter-clockwise, one part after
   the other, each coming out from under the one before and each faster than the last, so it
   gathers speed. The iris part lands last: light runs along it, it glows, a fine ring opens out
   from the mark. Then the name rises in under it, and it all lifts away to the app. Once a launch
   (kept in sessionStorage). A tap skips it; under reduced motion it is only a short fade. */

const R = 32;
const at = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${(50 + R * Math.cos(a)).toFixed(2)} ${(50 + R * Math.sin(a)).toFixed(2)}`;
};
const arc = (from: number, sweep: number) => `M${at(from)}A${R} ${R} 0 0 1 ${at(from + sweep)}`;
/** The same arc, drawn from its far end back to its start (so it can be drawn in backwards). */
const back = (from: number, sweep: number) => `M${at(from + sweep)}A${R} ${R} 0 0 0 ${at(from)}`;
const PARTS = [0, 1, 2, 3, 4];
const KEY = 'forma-intro';
/** The order the parts draw in (it ends on the iris one, 3), how long each takes, and its ease:
    slow to start, then quicker and quicker, with a soft landing. */
const ORDER = [2, 1, 0, 4, 3];
const DUR = [560, 400, 290, 210, 190];
const EASE = ['cubic-bezier(0.5, 0, 0.8, 0.6)', 'linear', 'linear', 'linear', 'cubic-bezier(0.2, 0.6, 0.3, 1)'];
const FIRST = 200;
const START = DUR.map((_, n) => FIRST + DUR.slice(0, n).reduce((a, b) => a + b, 0));
/** When the last part lands (ms). */
const LAND = START[4] + DUR[4];
/** When it starts to lift away, and when it is gone (ms). */
const LEAVE = LAND + 1150;
const GONE = LEAVE + 650;

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
        <svg width="96" height="96" viewBox="0 0 100 100" className="intro-mark overflow-visible" style={{ animationDelay: `${LAND - 60}ms` }}>
          <defs>
            {PARTS.map((i) => (
              // A part is cut where the next one starts, so the next reads as lying over it.
              <mask key={i} id={`intro-${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
                <rect width="100" height="100" fill="#fff" />
                {/* The first part drawn is only tucked under once the last one lands on it. */}
                <path
                  d={arc(-126 + 72 * (i + 1), 20)}
                  className={i === ORDER[0] ? 'intro-cut' : undefined}
                  style={i === ORDER[0] ? { animationDelay: `${LAND - 60}ms` } : undefined}
                  fill="none"
                  stroke="#000"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
              </mask>
            ))}
            <filter id="intro-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>
          {/* As the iris part lands: a fine ring opens out, and the part glows. */}
          <circle className="intro-ring" style={{ animationDelay: `${LAND - 40}ms` }} cx="50" cy="50" r={R} fill="none" stroke="#8C84F3" strokeWidth="0.8" />
          <path className="intro-glow" style={{ animationDelay: `${LAND - 120}ms` }} d={arc(-126 + 72 * 3, 76)} fill="none" stroke="#8C84F3" strokeWidth="15" strokeLinecap="round" filter="url(#intro-blur)" />
          <g style={{ filter: 'drop-shadow(0 0 6px rgba(140,132,243,0.45))' }}>
            {PARTS.map((i) => (
              <g key={i} mask={`url(#intro-${i})`}>
                <path
                  d={back(-126 + 72 * i, 76)}
                  pathLength={1}
                  className="intro-part"
                  style={{ animationDelay: `${START[ORDER.indexOf(i)]}ms`, animationDuration: `${DUR[ORDER.indexOf(i)]}ms`, animationTimingFunction: EASE[ORDER.indexOf(i)] }}
                  fill="none"
                  stroke={i === 3 ? '#8C84F3' : '#ECECEF'}
                  strokeWidth="13"
                  strokeLinecap="round"
                />
              </g>
            ))}
          </g>
          {/* Light runs along the iris part. */}
          <g mask="url(#intro-3)">
            <path className="intro-glint" style={{ animationDelay: `${LAND - 30}ms` }} d={back(-126 + 72 * 3, 76)} pathLength={1} fill="none" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="13" />
          </g>
        </svg>
        <span className="mt-7 flex font-display text-[30px] font-medium tracking-[-0.8px] text-ink">
          {'Forma'.split('').map((c, i) => (
            <span key={i} className="intro-letter" style={{ animationDelay: `${LAND + 60 + i * 55}ms` }}>
              {c}
            </span>
          ))}
        </span>
        <span className="intro-rule mt-5 h-px w-16" style={{ animationDelay: `${LAND + 420}ms` }} />
      </div>
    </div>
  );
}
