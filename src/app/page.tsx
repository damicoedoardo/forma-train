'use client';

import { useState } from 'react';
import { Glow, TabBar } from '@/ui';
import type { Tab } from '@/ui';

export default function Home() {
  const [tab, setTab] = useState<Tab>('today');
  return (
    <main className="relative min-h-[100dvh] overflow-hidden px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}>
      <Glow className="-left-10 -top-44" />
      <h1 className="relative font-display text-[40px] font-medium leading-[44px] tracking-[-1.2px]">{tab}</h1>
      <TabBar tab={tab} onChange={setTab} />
    </main>
  );
}
