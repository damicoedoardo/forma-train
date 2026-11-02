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
    <nav aria-label="Tabs" className="glass fixed inset-x-16 z-20 flex h-[60px] items-center justify-around rounded-pill" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}>
      {TABS.map(({ id, label, Icon }) => {
        const on = id === tab;
        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-current={on ? 'page' : undefined}
            onClick={() => onChange(id)}
            className={`flex h-11 w-11 items-center justify-center rounded-full ${on ? 'bg-white/[0.12] text-ink' : 'text-ink-muted'}`}
          >
            <Icon size={20} strokeWidth={1.8} aria-hidden />
          </button>
        );
      })}
    </nav>
  );
}
