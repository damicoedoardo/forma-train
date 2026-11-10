'use client';

import { useEffect, useState } from 'react';

/** The time, ticking every `ms` (a second by default), for clocks on screen. */
export function useNow(ms = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
}
