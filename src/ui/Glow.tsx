/* The light behind a screen: two soft lights and a fine grain over a base that is a little
   brighter at the top. The lights take their color from the mood, so the app feels different when
   you plan, work, rest and finish. Decoration only. */

export type Mood = 'calm' | 'work' | 'rest' | 'done';

// The main light (placed by `className`) and the second one, low on the other side.
const LIGHT: Record<Mood, [string, string]> = {
  calm: ['#494FDF', '#A78BF5'],
  work: ['#5A4BE6', '#E0794A'],
  rest: ['#3D43CF', '#8C84F3'],
  done: ['#D09A45', '#5A4BE6'],
};

// Fine film grain, so the dark reads as a material and the gradients don't band.
const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

export function Glow({ className = '', mood = 'calm' }: { className?: string; mood?: Mood }) {
  const [a, b] = LIGHT[mood];
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_-10%,#171A2C_0%,rgba(13,14,18,0)_70%)]" />
      <div aria-hidden className={`light pointer-events-none absolute h-[440px] w-[440px] rounded-full breathe blur-[110px] ${className}`} style={{ backgroundColor: a }} />
      <div aria-hidden className="light pointer-events-none absolute -right-48 bottom-24 h-[380px] w-[380px] rounded-full opacity-[0.11] blur-[120px]" style={{ backgroundColor: b }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
    </>
  );
}
