'use client';

import { useCallback, useEffect, useState } from 'react';
import { initialState, type TrainingState } from '../session';
import { loadSave, writeSave } from '@/platform/store';

/** The save on this phone. `ready` is false until it has loaded on the client. Every change goes through update(fn). */
export function useTraining() {
  const [state, setState] = useState<TrainingState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadSave());
    setReady(true);
    // Ask the browser not to evict our data under storage pressure.
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  const update = useCallback((fn: (s: TrainingState) => TrainingState) => {
    setState((prev) => {
      const next = fn(prev);
      writeSave(next);
      return next;
    });
  }, []);

  return { state, ready, update };
}
