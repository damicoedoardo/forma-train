'use client';

import { useEffect, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { INK, anatomyFor, scene } from '@/features/exercises/anatomy/body';

/** One rep, in seconds. */
const REP = 3.2;

/** Forma's own exercise animation (features/exercises/anatomy): a plain body doing one rep on a
    loop, the muscles it works colored in. Still under reduced motion and for holds. With no
    animation for the move, a quiet tile. */
export function BodyDemo({ move, name, view = 'side', className = '' }: { move: string; name: string; view?: 'side' | 'front'; className?: string }) {
  const body = anatomyFor(move, name);
  const [t, setT] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (!body) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStill(true);
      return;
    }
    let raf = 0;
    let last = 0;
    const start = performance.now();
    const tick = (now: number) => {
      // About 30 frames a second is smooth enough and spares the phone.
      if (now - last > 32) {
        last = now;
        setT(((now - start) / 1000 / REP) % 1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [body?.id]);

  if (!body)
    return (
      <div aria-hidden className={`flex shrink-0 items-center justify-center bg-white/[0.04] text-ink-faint ${className}`}>
        <Dumbbell size={18} strokeWidth={1.75} />
      </div>
    );
  const s = scene(body.id, view, t, { still, variant: body.variant });
  return (
    <svg viewBox={s.viewBox} role="img" aria-label={`${name}, how it moves`} className={`shrink-0 ${className}`} style={{ background: INK.ground }}>
      {s.shapes.map((p, i) => (
        <path key={i} d={p.d} fill={p.fill ?? 'none'} stroke={p.stroke} strokeWidth={p.width} strokeLinejoin="round" strokeLinecap={p.round ? 'round' : undefined} fillOpacity={p.opacity} />
      ))}
    </svg>
  );
}
