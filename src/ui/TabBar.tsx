'use client';

import { CircleUserRound, Clock3, MessageSquare, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Tab = 'today' | 'coach' | 'friends' | 'you';

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'today', label: 'Today', Icon: Clock3 },
  { id: 'coach', label: 'Coach', Icon: MessageSquare },
  { id: 'friends', label: 'Friends', Icon: Users },
  { id: 'you', label: 'You', Icon: CircleUserRound },
];

/** The floating glass tab bar: icons only, the open tab lit. */
export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav aria-label="Tabs" className="tabbar glass fixed inset-x-16 z-20 grid h-[60px] grid-cols-4 items-center rounded-pill" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}>
      {/* The lit circle slides under the open tab. */}
      <span aria-hidden className="absolute left-0 top-2 h-11 w-1/4 transition-transform duration-300 ease-out" style={{ transform: `translateX(${TABS.findIndex((t) => t.id === tab) * 100}%)` }}>
        <span className="mx-auto block h-11 w-11 rounded-full bg-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />
      </span>
      {TABS.map(({ id, label, Icon }) => {
        const on = id === tab;
        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-current={on ? 'page' : undefined}
            onClick={() => onChange(id)}
            className={`press relative mx-auto flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-200 ${on ? 'text-ink' : 'text-ink-muted'}`}
          >
            <Icon size={20} strokeWidth={1.8} aria-hidden />
          </button>
        );
      })}
    </nav>
  );
}
