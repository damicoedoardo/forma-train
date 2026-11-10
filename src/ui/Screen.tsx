import type { ReactNode } from 'react';
import { Glow, type Mood } from './Glow';

/** A full screen: the base, its light (colored by `mood`), safe-area padding, and room for the tab bar under it. */
export function Screen({ children, glow = '-left-10 -top-44', tabs = true, className = '', view, bar, mood }: { mood?: Mood; children: ReactNode; /** Stays put under the screen (the tab bar). */ bar?: ReactNode; glow?: string; tabs?: boolean; className?: string; /** Names what is on screen: a new name plays the entrance again. */ view?: string }) {
  return (
    <main
      className={`relative mx-auto flex min-h-[100dvh] max-w-[480px] flex-col overflow-x-clip px-4 ${className}`}
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)', paddingBottom: tabs ? 'calc(env(safe-area-inset-bottom) + 100px)' : 'calc(env(safe-area-inset-bottom) + 24px)' }}
    >
      <Glow className={glow} mood={mood} />
      <div key={view} className="rise relative flex flex-1 flex-col">
        {children}
      </div>
      {bar}
    </main>
  );
}

/** A small muted heading over a group. */
export function Label({ children }: { children: ReactNode }) {
  return <span className="px-1 text-[13px] text-ink-muted">{children}</span>;
}

/** A small glass pill to tap: a quick reply, a choice. `on` lights it. */
export function Chip({ children, on = false, onClick, className = '' }: { children: ReactNode; on?: boolean; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={`press h-10 shrink-0 rounded-pill px-4 text-[14px] ${on ? 'btn-primary font-medium text-base' : 'glass text-ink-soft'} ${className}`}>
      {children}
    </button>
  );
}
