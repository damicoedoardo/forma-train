'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cloudConfigured, maybeSignedIn } from '@/platform/api';
import { door, type Door } from '../gate';
import { useCloudStatus } from './useCloudStatus';

const BROWSER_KEY = 'forma-train-browser-ok';

const installed = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Which screen the app opens on (see gate.ts): install, sign-in or the app. Null until known.
    `goOnInBrowser` is the computer's "Use it in this browser". */
export function useDoor(sandbox: boolean): { door: Door | null; busy: boolean; goOnInBrowser: () => void } {
  const cloud = useCloudStatus();
  const [seen, setSeen] = useState<{ installed: boolean; browserOk: boolean; guess: boolean } | null>(null);
  // Set once the sign-in screen has shown, so only a fresh sign-in waits for the save.
  const asked = useRef(false);

  useEffect(() => {
    let browserOk = false;
    try {
      browserOk = localStorage.getItem(BROWSER_KEY) === '1';
    } catch {
      // No storage: ask again next time.
    }
    setSeen({ installed: installed(), browserOk, guess: maybeSignedIn() });
  }, []);

  const goOnInBrowser = useCallback(() => {
    try {
      localStorage.setItem(BROWSER_KEY, '1');
    } catch {
      // Only for this visit then.
    }
    setSeen((s) => s && { ...s, browserOk: true });
  }, []);

  if (!seen) return { door: null, busy: false, goOnInBrowser };
  // Until Supabase has answered, a stored sign-in counts: the app opens offline too.
  const signedIn = cloud.known ? cloud.signedIn : seen.guess;
  const fetching = asked.current && signedIn && !cloud.met;
  const d = door({ installed: seen.installed, browserOk: seen.browserOk, signedIn, fetching, cloud: cloudConfigured, sandbox });
  if (d === 'sign-in') asked.current = true;
  return { door: d, busy: fetching, goOnInBrowser };
}
