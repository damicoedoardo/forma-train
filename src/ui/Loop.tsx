import { Dumbbell } from 'lucide-react';

/** A short loop from two still frames (the start and the end of a move), shown one after the
    other. Without frames, a quiet tile. Decoration: the name sits next to it. */
export function Loop({ frames, className = '' }: { frames: [string, string] | null; className?: string }) {
  return (
    <div aria-hidden className={`relative shrink-0 overflow-hidden bg-white/[0.04] ${className}`}>
      {frames ? (
        <>
          <img src={frames[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <img src={frames[1]} alt="" loading="lazy" className="loop-frame absolute inset-0 h-full w-full object-cover" />
          <span className="absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
        </>
      ) : (
        <span className="flex h-full w-full items-center justify-center text-ink-faint">
          <Dumbbell size={18} strokeWidth={1.75} />
        </span>
      )}
    </div>
  );
}
