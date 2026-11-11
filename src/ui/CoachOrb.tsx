'use client';

import { useEffect, useId, useRef } from 'react';

/* The coach, alive: the Forma weave as the coach's face in the chat and in voice.
   - `idle`: the whole mark, still.
   - `thinking` (working, calling tools): the five parts draw in counter-clockwise, one after
     another at one even pace, each out from under the one before, ending on the iris part. The
     mark rests whole for a beat, then turns once and the parts let go in the same order, and it
     weaves again. The turn slows into the rest and gathers out of it; the draw never changes pace.
   - `talking`: the whole mark breathes with the voice, each part pushed out a little in turn.
   - `listening`: the whole mark, the white parts dimmed, a slow breath.
   Leaving `thinking`, it finishes its weave and lands whole before it talks. Under reduced motion
   it stays still. */

export type OrbMode = 'idle' | 'thinking' | 'talking' | 'listening';

const R = 36;
const W = 9;
const at = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${(50 + R * Math.cos(a)).toFixed(2)} ${(50 + R * Math.sin(a)).toFixed(2)}`;
};
const arc = (from: number, sweep: number) => `M${at(from)}A${R} ${R} 0 0 1 ${at(from + sweep)}`;
/** The same arc, drawn from its far end back to its start. */
const back = (from: number, sweep: number) => `M${at(from + sweep)}A${R} ${R} 0 0 0 ${at(from)}`;
const PARTS = [0, 1, 2, 3, 4];
/** The order the parts draw in: counter-clockwise, ending on the iris one (3). */
const ORDER = [2, 1, 0, 4, 3];

/** One weave, in seconds: draw the five parts, rest whole, let them go, a short pause. */
const PART = 0.3;
const DRAW = PART * 5;
const REST = 0.7;
const LET_GO = PART * 5;
const GAP = 0.3;
const CYCLE = DRAW + REST + LET_GO + GAP;
/** The middle of the rest: whole, and the turn is still. Thinking starts and lands here. */
const STILL = DRAW + REST / 2;

const clamp = (v: number) => Math.max(0, Math.min(1, v));
/** A soft start and landing for the first and last part only, like the opening. */
const draw = (x: number, n: number) => {
  const v = clamp(x);
  if (n === 0) return v * v * (1.6 - 0.6 * v);
  if (n === 4) return 1 - (1 - v) * (1 - v) * (1.6 - 0.6 * (1 - v));
  return v;
};

/** How far each part is drawn at a moment `p` of the cycle: from `tail` to `head`, 0 to 1. */
function weaveAt(p: number) {
  return PARTS.map((i) => {
    const n = ORDER.indexOf(i);
    const head = draw((p - n * PART) / PART, n);
    const tail = draw((p - DRAW - REST - n * PART) / PART, n);
    return { head, tail };
  });
}

/** The turn: one full turn a cycle, still at STILL, quickest halfway between. */
function turnAt(p: number) {
  const f = (((p - STILL) % CYCLE) + CYCLE) % CYCLE / CYCLE;
  return -360 * (f - Math.sin(2 * Math.PI * f) / (2 * Math.PI));
}

/** A voice-like level, 0 to 1, for the mockup: syllables and short breaths. */
export function voiceLevel(t: number) {
  const syll = Math.max(0, Math.sin(t * 8.6) * 0.55 + Math.sin(t * 13.3 + 1.1) * 0.3 + 0.35);
  const phrase = clamp(Math.sin(t * 1.3) * 0.6 + 0.7);
  return clamp(syll * phrase);
}

export function CoachOrb({ mode, size = 96, level, className = '', label }: { mode: OrbMode; size?: number; /** The voice level, 0 to 1, while talking; a made-up one if left out. */ level?: () => number; className?: string; label?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const turn = useRef<SVGGElement>(null);
  const glow = useRef<SVGPathElement>(null);
  const parts = useRef<(SVGPathElement | null)[]>([]);
  const groups = useRef<(SVGGElement | null)[]>([]);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const levelRef = useRef(level);
  levelRef.current = level;

  useEffect(() => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Where the weave is in its cycle, and whether it is weaving (else it rests whole at STILL).
    let p = STILL;
    let weaving = false;
    let last = performance.now();
    let start = last;
    let smooth = 0;
    let raf = 0;

    const paint = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;
      const m = still ? 'idle' : modeRef.current;
      if (m === 'thinking') weaving = true;
      if (weaving) {
        const before = p;
        p += dt;
        // Asked to stop: carry on to the next rest, then land there.
        if (m !== 'thinking') {
          const crossed = before < STILL ? p >= STILL : p >= STILL + CYCLE;
          if (crossed) {
            p = STILL;
            weaving = false;
          }
        }
        if (p >= CYCLE + STILL) p -= CYCLE;
      }
      const cycleP = p % CYCLE;
      const w = weaving ? weaveAt(cycleP) : PARTS.map(() => ({ head: 1, tail: 0 }));
      const angle = weaving ? turnAt(p) : 0;

      const target = m === 'talking' ? (levelRef.current ? levelRef.current() : voiceLevel(t)) : m === 'listening' ? 0.12 + 0.08 * Math.sin(t * 2.2) : 0;
      smooth += (target - smooth) * Math.min(1, dt * 14);
      const breath = m === 'listening' ? 1 + 0.025 * Math.sin(t * 2.2) : 1 + 0.035 * smooth;

      turn.current?.setAttribute('transform', `rotate(${angle.toFixed(2)} 50 50) translate(50 50) scale(${breath.toFixed(4)}) translate(-50 -50)`);
      PARTS.forEach((i) => {
        const el = parts.current[i];
        const g = groups.current[i];
        if (!el || !g) return;
        const { head, tail } = w[i];
        const len = Math.max(0, head - tail);
        // A dash from `tail` to `head` with a long gap after it, the offset kept positive (Safari).
        el.setAttribute('stroke-dasharray', `${len.toFixed(4)} 3`);
        el.setAttribute('stroke-dashoffset', (len + 3 - tail).toFixed(4));
        el.setAttribute('opacity', len > 0.001 ? (m === 'listening' && i !== 3 ? '0.55' : '1') : '0');
        // Tucked under the next part only while that part shows; the first drawn only once the
        // last one has landed on it.
        const next = w[(i + 1) % 5];
        const tuck = i === ORDER[0] ? next.head >= 0.98 && next.tail < 1 : next.head > 0 && next.tail < 1;
        el.parentElement?.setAttribute('mask', tuck ? `url(#${uid}-${i})` : 'none');
        // Talking: each part pushed out from the middle a little, in turn.
        const mid = ((-126 + 72 * i + 38) * Math.PI) / 180;
        const push = m === 'talking' ? 2.4 * smooth * (0.55 + 0.45 * Math.sin(t * 5.2 + i * 1.26)) : 0;
        g.setAttribute('transform', `translate(${(Math.cos(mid) * push).toFixed(3)} ${(Math.sin(mid) * push).toFixed(3)})`);
      });
      glow.current?.setAttribute('opacity', (m === 'talking' ? 0.3 + 0.5 * smooth : weaving ? 0.2 + 0.25 * Math.min(1, w[3].head - w[3].tail) : 0.3).toFixed(3));
      raf = requestAnimationFrame(paint);
    };
    start = performance.now();
    raf = requestAnimationFrame(paint);
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(paint);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [uid]);

  return (
    <div role="img" aria-label={label} className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" aria-hidden>
        <defs>
          {PARTS.map((i) => (
            // A part is cut where the next one starts, so the next reads as lying over it.
            <mask key={i} id={`${uid}-${i}`} maskUnits="userSpaceOnUse" x="-20" y="-20" width="140" height="140">
              <rect x="-20" y="-20" width="140" height="140" fill="#fff" />
              <path d={arc(-126 + 72 * (i + 1), 18)} fill="none" stroke="#000" strokeWidth={W + 4} strokeLinecap="round" />
            </mask>
          ))}
          <filter id={`${uid}-blur`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
        </defs>
        <g ref={turn}>
          {/* The faint whole mark behind, so the weave always has a place. */}
          {PARTS.map((i) => (
            <path key={i} d={arc(-126 + 72 * i, 76)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={W} strokeLinecap="round" />
          ))}
          {/* A soft iris glow under the iris part. */}
          <path ref={glow} d={arc(-126 + 72 * 3, 76)} fill="none" stroke="#8C84F3" strokeWidth={W * 1.9} strokeLinecap="round" filter={`url(#${uid}-blur)`} opacity="0.3" />
          <g style={{ filter: 'drop-shadow(0 0 3px rgba(140,132,243,0.4))' }}>
            {PARTS.map((i) => (
              <g key={i} ref={(el) => void (groups.current[i] = el)}>
                <g>
                  <path
                    ref={(el) => void (parts.current[i] = el)}
                    d={back(-126 + 72 * i, 76)}
                    fill="none"
                    stroke={i === 3 ? '#8C84F3' : '#ECECEF'}
                    strokeWidth={W}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="1 3"
                    strokeDashoffset="3"
                  />
                </g>
              </g>
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
