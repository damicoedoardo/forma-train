'use client';

import { useEffect } from 'react';
import { startAnalytics } from '../analytics';

/** Starts analytics after the page has loaded. */
export function Analytics() {
  useEffect(() => {
    void startAnalytics();
  }, []);
  return null;
}
