'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { TrainingState } from '@/features/training/session';
import { identify } from '@/platform/analytics';
import { CLOUD_START, cloudConfigured, maybeSignedIn, Offline, supabase } from '@/platform/api';
import { cloudState, plan, type CloudCopy } from '../cloud';
import { getCloud, lastRev, putCloud, rememberRev, setCloudStatus } from '../client';

/** How long after a change the save goes up, so a burst of taps is one upload. */
const PUSH_AFTER_MS = 3000;

/** Keeps the cloud copy in step with this phone while signed in. Off in the sandbox and when the
    cloud isn't set up. Also keeps the sign-in status (`useCloudStatus`) current. */
export function useCloudSync(state: TrainingState, update: (fn: (s: TrainingState) => TrainingState) => void, off: boolean) {
  const user = useRef<string | null>(null);
  const latest = useRef(state);
  latest.current = state;
  // The save as last sent or taken, so an unchanged save is never sent again.
  const synced = useRef<string | null>(null);
  const busy = useRef(false);

  // meet and push call each other (a clash on push means meeting the cloud again), so they live in refs.
  const meet = useRef(async (_known?: CloudCopy | null) => {});
  const push = useRef(async (_baseRev: number | null) => {});

  meet.current = async (known?: CloudCopy | null) => {
    const id = user.current;
    if (!id) return;
    const cloud = known !== undefined ? known : await getCloud();
    const p = plan(latest.current, cloud, lastRev(id));
    if (p.kind === 'use-cloud') {
      const s = cloud && cloudState(cloud);
      if (!cloud || !s) return;
      synced.current = JSON.stringify(s);
      rememberRev(id, cloud.rev);
      update(() => s);
      setCloudStatus({ phase: 'saved', savedAt: cloud.updated_at, workouts: cloud.workouts });
    } else if (JSON.stringify(latest.current) !== synced.current || p.baseRev !== lastRev(id)) {
      await push.current(p.baseRev);
    } else {
      setCloudStatus({ phase: 'saved', savedAt: cloud?.updated_at, workouts: cloud?.workouts });
    }
  };

  push.current = async (baseRev: number | null) => {
    const id = user.current;
    if (!id) return;
    const s = latest.current;
    const body = JSON.stringify(s);
    setCloudStatus({ phase: 'saving' });
    const r = await putCloud(s, baseRev);
    if (r.ok) {
      synced.current = body;
      rememberRev(id, r.copy.rev);
      setCloudStatus({ phase: 'saved', savedAt: r.copy.updated_at, workouts: r.copy.workouts });
    } else {
      await meet.current(r.current);
    }
  };

  /** One sync step at a time; failures become the status. */
  const run = useCallback(async (step: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await step();
    } catch (e) {
      setCloudStatus({ phase: e instanceof Offline ? 'offline' : 'error' });
    } finally {
      busy.current = false;
    }
  }, []);

  // Sign-in state: Supabase loads only when this phone may be signed in, or once someone signs in.
  useEffect(() => {
    if (off || !cloudConfigured) return;
    let stop = () => {};
    let started = false;
    const start = async () => {
      if (started) return;
      started = true;
      const auth = (await supabase()).auth;
      const { data } = auth.onAuthStateChange((_event, session) => {
        const id = session?.user.id ?? null;
        const was = user.current;
        user.current = id;
        setCloudStatus({ signedIn: !!id, known: true, email: session?.user.email ?? null, userId: id });
        if (id !== was) identify(id);
        if (id && id !== was) {
          synced.current = null;
          setCloudStatus({ met: false });
          void run(() => meet.current()).finally(() => setCloudStatus({ met: true }));
        }
        if (!id) setCloudStatus({ phase: 'idle', savedAt: undefined, met: false });
      });
      stop = () => data.subscription.unsubscribe();
    };
    if (maybeSignedIn()) void start();
    const onStart = () => void start();
    window.addEventListener(CLOUD_START, onStart);
    return () => {
      stop();
      window.removeEventListener(CLOUD_START, onStart);
    };
  }, [off, run]);

  // Every change goes up a few seconds later.
  useEffect(() => {
    if (off || !user.current) return;
    if (JSON.stringify(state) === synced.current) return;
    const t = window.setTimeout(() => {
      const id = user.current;
      if (id) void run(() => push.current(lastRev(id)));
    }, PUSH_AFTER_MS);
    return () => window.clearTimeout(t);
  }, [state, off, run]);

  useEffect(() => {
    if (off) return;
    const retry = () => {
      if (user.current && JSON.stringify(latest.current) !== synced.current) void run(() => meet.current());
    };
    // Back to the front: look for a newer save from another device. To the back: send what waits.
    const flip = () => {
      const id = user.current;
      if (!id) return;
      if (document.visibilityState === 'visible') void run(() => meet.current());
      else if (JSON.stringify(latest.current) !== synced.current) void run(() => push.current(lastRev(id)));
    };
    window.addEventListener('online', retry);
    document.addEventListener('visibilitychange', flip);
    return () => {
      window.removeEventListener('online', retry);
      document.removeEventListener('visibilitychange', flip);
    };
  }, [off, run]);
}
