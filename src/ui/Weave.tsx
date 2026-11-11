import { useId, type ReactNode } from 'react';

const R = 42;
const W = 7;
const at = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${(50 + R * Math.cos(a)).toFixed(2)} ${(50 + R * Math.sin(a)).toFixed(2)}`;
};
const arc = (from: number, sweep: number) => `M${at(from)}A${R} ${R} 0 0 1 ${at(from + sweep)}`;
const PARTS = [0, 1, 2, 3, 4];

type Props = {
  size?: number;
  /** How much of the logo is woven, 0 to 1: its five parts draw in one after another. */
  value: number;
  label?: string;
  /** One soft pulse of light around it (a new best). */
  flash?: boolean;
  children?: ReactNode;
  className?: string;
};

/** The Forma logo as a clock (the rest screen): the weave's five parts draw in one after another
    as `value` grows, each tucking under the next, until the mark is whole. What it counts sits in
    the middle. The faint whole mark shows behind from the start. */
export function Weave({ size = 264, value, label, flash, children, className = '' }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const v = Math.max(0, Math.min(1, value));
  // How far each part is drawn, 0 to 1.
  const drawn = PARTS.map((i) => Math.max(0, Math.min(1, v * 5 - i)));
  return (
    <div role="img" aria-label={label} className={`relative shrink-0 ${className}`} style={{ width: `min(${size}px, 40dvh)`, height: `min(${size}px, 40dvh)` }}>
      {flash && <span aria-hidden className="best-halo pointer-events-none absolute inset-0 rounded-full" />}
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" aria-hidden>
        <defs>
          {PARTS.map((i) => (
            // A part is cut where the next one starts, so the next reads as lying over it.
            <mask key={i} id={`${uid}-${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
              <rect width="100" height="100" fill="#fff" />
              <path d={arc(-126 + 72 * (i + 1), 16)} fill="none" stroke="#000" strokeWidth={W + 3.4} strokeLinecap="round" />
            </mask>
          ))}
        </defs>
        {PARTS.map((i) => (
          <g key={i} mask={`url(#${uid}-${i})`}>
            <path d={arc(-126 + 72 * i, 76)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={W} strokeLinecap="round" />
          </g>
        ))}
        <g style={{ filter: 'drop-shadow(0 0 2.6px rgba(110,116,240,0.5))' }}>
          {PARTS.map((i) => (
            // Tucked under the next part only once that part is there.
            <g key={i} mask={drawn[(i + 1) % 5] > 0 ? `url(#${uid}-${i})` : undefined}>
              <path
                d={arc(-126 + 72 * i, 76)}
                className="ring-arc"
                fill="none"
                stroke={i === 3 ? '#8C84F3' : '#ECECEF'}
                strokeWidth={W}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - drawn[i]}
                opacity={drawn[i] > 0 ? 1 : 0}
              />
            </g>
          ))}
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
