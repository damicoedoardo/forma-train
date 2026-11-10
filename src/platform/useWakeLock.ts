"use client";

import { useEffect } from "react";

/** Keep the screen on while `on` (a workout under way), where the phone allows. The phone drops
    the lock when the app goes to the back, so it is asked for again on the way back. */
export function useWakeLock(on = true): void {
  useEffect(() => {
    if (!on || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let gone = false;
    const ask = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const got = await navigator.wakeLock.request("screen");
        if (gone) void got.release();
        else lock = got;
      } catch {
        // Low battery or not allowed: the screen sleeps as usual.
      }
    };
    void ask();
    document.addEventListener("visibilitychange", ask);
    return () => {
      gone = true;
      document.removeEventListener("visibilitychange", ask);
      void lock?.release();
    };
  }, [on]);
}
