'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TrainingState } from '@/features/training/session';
import type { Cheer } from '../cheers';
import { myCard } from '../friends';
import { getFriends, profilePhotoUrl, sendCard, takeCheers } from '../client';

export interface Me {
  place: string;
  about: string;
  /** Your photo as a link the page can show, or null. */
  photo: string | null;
}

/** How often the card goes up while the app is open (the server shows you online for 75 s), and
    how often cheers are fetched while you work out. */
const BEAT_MS = 30_000;
const CHEERS_MS = 15_000;

/** While signed in: your card and heartbeat, your friend code, and the cheers friends send while
    you train (one at a time, `cheer`, until `seen`), and your own profile (`me`, fetched again
    with `refreshMe` after you change it). */
export function useSocial(state: TrainingState, signedIn: boolean, training: string | null) {
  const [code, setCode] = useState<string | null>(null);
  const [queue, setQueue] = useState<Cheer[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [asked, setAsked] = useState(0);
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    if (!signedIn) return;
    const beat = () => {
      if (document.visibilityState !== 'visible') return;
      sendCard(myCard(latest.current, training))
        .then((r) => setCode(r.code))
        .catch(() => {});
    };
    beat();
    const t = window.setInterval(beat, BEAT_MS);
    return () => window.clearInterval(t);
  }, [signedIn, training]);

  useEffect(() => {
    if (!signedIn || !training) return;
    const take = () =>
      takeCheers()
        .then((r) => r.cheers.length && setQueue((q) => [...q, ...r.cheers]))
        .catch(() => {});
    take();
    const t = window.setInterval(take, CHEERS_MS);
    return () => window.clearInterval(t);
  }, [signedIn, training]);

  useEffect(() => {
    if (!signedIn) {
      setMe(null);
      return;
    }
    let gone = false;
    getFriends()
      .then(async (l) => {
        const id = l.me.id;
        const photo = id && l.me.photo ? await profilePhotoUrl(id, l.me.photo).catch(() => null) : null;
        if (!gone) setMe({ place: l.me.place ?? '', about: l.me.about ?? '', photo });
        if (!gone) setCode(l.me.code);
      })
      .catch(() => {});
    return () => {
      gone = true;
    };
  }, [signedIn, asked]);

  const refreshMe = useCallback(() => setAsked((n) => n + 1), []);
  const seen = useCallback(() => setQueue((q) => q.slice(1)), []);
  return { code, cheer: queue[0] ?? null, seen, me, refreshMe };
}
