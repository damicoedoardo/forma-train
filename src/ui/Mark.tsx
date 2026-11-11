import { useId } from 'react';

const R = 32;
const at = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${(50 + R * Math.cos(a)).toFixed(2)} ${(50 + R * Math.sin(a)).toFixed(2)}`;
};
const arc = (from: number, sweep: number) => `M${at(from)}A${R} ${R} 0 0 1 ${at(from + sweep)}`;

/** Forma's mark: the weave from the app icon (five parts of a ring, each tucked under the
    next, one in iris) and the name. */
export function Mark({ className = '' }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const parts = [0, 1, 2, 3, 4];
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg width="20" height="20" viewBox="0 0 100 100" aria-hidden>
        <defs>
          {parts.map((i) => (
            // A part is cut where the next one starts, so the next reads as lying over it.
            <mask key={i} id={`${uid}-${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
              <rect width="100" height="100" fill="#fff" />
              <path d={arc(-126 + 72 * (i + 1), 20)} fill="none" stroke="#000" strokeWidth="18" strokeLinecap="round" />
            </mask>
          ))}
        </defs>
        {parts.map((i) => (
          <g key={i} mask={`url(#${uid}-${i})`}>
            <path d={arc(-126 + 72 * i, 76)} fill="none" stroke={i === 3 ? '#8C84F3' : '#ECECEF'} strokeWidth="13" strokeLinecap="round" />
          </g>
        ))}
      </svg>
      <span className="font-display text-[17px] font-medium tracking-[-0.3px]">Forma</span>
    </span>
  );
}
