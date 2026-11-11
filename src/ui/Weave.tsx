import { useId, type ReactNode } from 'react';

const R = 42;
const W = 7;
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
    as `value` grows, counter-clockwise, each coming out from under the one before, until the mark is whole. What it counts sits in
    the middle. The faint whole mark shows behind from the start. */
export function Weave({ size = 264, value, label, flash, children, className = '' }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const v = Math.max(0, Math.min(1, value));
  // How far each part is drawn, 0 to 1. Like the opening screen, the weave builds counter-clockwise,
  // each part coming out from under the one before it, and ends on the iris part.
  const drawn = PARTS.map((i) => Math.max(0, Math.min(1, v * 5 - ORDER.indexOf(i))));
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
            // Tucked under the next part only once that part's head is there: always for the parts
            // drawn after it, and for the first one drawn when the last one lands on it.
            <g key={i} mask={(i === ORDER[0] ? drawn[ORDER[4]] >= 0.98 : drawn[(i + 1) % 5] > 0) ? `url(#${uid}-${i})` : undefined}>
              <path
                d={back(-126 + 72 * i, 76)}
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
