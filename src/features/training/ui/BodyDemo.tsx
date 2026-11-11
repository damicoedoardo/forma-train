'use client';

import { useEffect, useId, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { INK, anatomyFor, scene, type Shape } from '@/features/exercises/anatomy/body';

/** One rep, in seconds. */
const REP = 3.6;

/** Forma's own exercise animation (features/exercises/anatomy): a lit body doing one rep on a
    loop, slow on the way down, the worked muscles lighting up with the effort and the far end
    of the move standing faint behind. Still under reduced motion and for holds. With no
    animation for the move, a quiet tile. `small` (list rows) leaves out the blurs to spare
    the phone. */
export function BodyDemo({ move, name, view = 'side', small = false, bare = false, className = '' }: { move: string; name: string; view?: 'side' | 'front'; small?: boolean; /** No tile behind it: the body stands on the screen's own light. */ bare?: boolean; className?: string }) {
  const body = anatomyFor(move, name);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
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
  const s = scene(body.id, view, t, { still, variant: body.variant, rich: true });
  const [x, y, w, h] = s.viewBox.split(' ').map(Number);
  // The scene names its gradients `fm-…`; each player on the page needs its own.
  const own = (v?: string) => (v ? v.replace('#fm-', `#${uid}-`) : v);
  const path = (p: Shape, i: number) => (
    <path key={i} d={p.d} fill={own(p.fill) ?? 'none'} stroke={own(p.stroke)} strokeWidth={p.width} strokeLinejoin="round" strokeLinecap={p.round ? 'round' : undefined} fillOpacity={p.opacity} />
  );
  const of = (kind: Shape['kind']) => s.shapes.filter((p) => p.kind === kind);
  return (
    <svg viewBox={s.viewBox} role="img" aria-label={`${name}, how it moves`} className={`shrink-0 ${className}`} style={bare ? undefined : { background: INK.ground }}>
      <defs>
        <linearGradient id={`${uid}-skin`} gradientUnits="userSpaceOnUse" x1={x} y1={y} x2={x + w * 0.25} y2={y + h}>
          <stop offset="0" stopColor="#DDDFE7" />
          <stop offset="1" stopColor="#8B8D9C" />
        </linearGradient>
        <linearGradient id={`${uid}-far`} gradientUnits="userSpaceOnUse" x1={x} y1={y} x2={x} y2={y + h}>
          <stop offset="0" stopColor="#9FA1AE" />
          <stop offset="1" stopColor="#6C6E7B" />
        </linearGradient>
        <linearGradient id={`${uid}-floor`} gradientUnits="userSpaceOnUse" x1={x} y1="0" x2={x + w} y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${uid}-spot`} cx="0.5" cy="0.42" r="0.6">
          <stop offset="0" stopColor="#2A2C4A" />
          <stop offset="1" stopColor="#15161C" stopOpacity="0" />
        </radialGradient>
        {!small && (
          <>
            <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
            <filter id={`${uid}-soft`} x="-20%" y="-300%" width="140%" height="700%">
              <feGaussianBlur stdDeviation="2.2" />
            </filter>
          </>
        )}
      </defs>
      {!bare && <rect x={x} y={y} width={w} height={h} fill={`url(#${uid}-spot)`} />}
      <g filter={small ? undefined : `url(#${uid}-soft)`} opacity={small ? 0.5 : undefined}>
        {of('shadow').map(path)}
      </g>
      <g opacity="0.07">{of('ghost').map(path)}</g>
      {s.shapes.filter((p) => !p.kind).map(path)}
      {!small && (
        <g filter={`url(#${uid}-glow)`} style={{ mixBlendMode: 'screen' }}>
          {of('glow').map(path)}
        </g>
      )}
    </svg>
  );
}
