import type { ReactNode } from 'react';

/* The ring: Forma's one signature shape. A circle cut into segments, one per set (or per day):
   done ones are lit, the one you are on is the accent, the rest wait. With no segments it is one
   arc that fills or drains (the rest clock). What it counts sits in the middle. */

type Props = {
  size?: number;
  stroke?: number;
  /** Segments in all, how many are done, and whether the next one is "now" (accent). */
  of?: number;
  done?: number;
  now?: boolean;
  /** No segments: one arc, 0 to 1. `tone` is its color: the accent (a clock running) or ink (done). */
  value?: number;
  tone?: 'accent' | 'ink';
  label?: string;
  children?: ReactNode;
  className?: string;
};

export function Ring({ size = 264, stroke = 6, of, done = 0, now = true, value, tone = 'accent', label, children, className = '' }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mid = size / 2;
  const base = { cx: mid, cy: mid, r, fill: 'none', strokeWidth: stroke, strokeLinecap: 'round' as const };
  // A gap between segments, a little wider than the round caps that eat into it.
  const gap = of && of > 1 ? stroke * 2.6 : 0;
  const seg = of ? c / of - gap : c;
  return (
    <div role="img" aria-label={label} className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 overflow-visible" aria-hidden>
        {of ? (
          Array.from({ length: of }, (_, i) => {
            const isNow = now && i === done;
            return (
              <circle
                key={i}
                {...base}
                className="ring-seg"
                stroke={i < done ? '#ECECEF' : isNow ? '#6E74F0' : 'rgba(255,255,255,0.09)'}
                style={isNow ? { filter: 'drop-shadow(0 0 6px rgba(110,116,240,0.55))' } : undefined}
                strokeDasharray={`${seg} ${c - seg}`}
                strokeDashoffset={-(i * (c / of) + gap / 2)}
              />
            );
          })
        ) : (
          <>
            <circle {...base} stroke="rgba(255,255,255,0.09)" />
            <circle {...base} className="ring-arc" stroke={tone === 'ink' ? '#ECECEF' : '#6E74F0'} style={tone === 'ink' ? undefined : { filter: 'drop-shadow(0 0 6px rgba(110,116,240,0.5))' }} strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value ?? 0)))} />
          </>
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
