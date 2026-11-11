'use client';

import { useEffect } from 'react';

/** A text field: focusing one brings the keyboard up. */
function isField(el: EventTarget | null): boolean {
  return el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

/**
 * Puts the screen back together after the keyboard closes, on an installed iPhone app.
 *
 * iOS has a bug there: once the keyboard has been up, the page keeps the shorter height it had with
 * the keyboard open. The tab bar then floats in the middle of the screen, where the top of the
 * keyboard was, and the header no longer sticks under the clock. Hiding the page for one layout and
 * showing it again makes iOS measure the screen afresh. It all happens before the next frame is
 * drawn; the scroll is put back where it was.
 *
 * Hiding the page also starts every CSS animation on it over (a screen's parts rise in again), which
 * looks like the app blinking. So it only runs after the keyboard has really been up, never just
 * because the app was opened or brought back.
 */
export function ViewportHeal() {
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!standalone) return;

    // True once the keyboard has been up, until the screen has been healed after it.
    let keyboard = false;
    const heal = () => {
      if (isField(document.activeElement)) return;
      const { scrollX: x, scrollY: y } = window;
      const body = document.body;
      // The page scrolls inside the body, and hiding it drops that scroll too.
      const top = body.scrollTop;
      body.style.display = 'none';
      void body.offsetHeight;
      body.style.display = '';
      window.scrollTo(x, y);
      body.scrollTop = top;
    };
    // iOS settles the screen in steps as the keyboard slides away, so heal soon and once more later.
    const timers: number[] = [];
    const healSoon = () => {
      if (!keyboard) return;
      timers.forEach((t) => window.clearTimeout(t));
      timers.length = 0;
      timers.push(
        window.setTimeout(heal, 150),
        window.setTimeout(() => {
          heal();
          if (!isField(document.activeElement)) keyboard = false;
        }, 600),
      );
    };

    const onFocusIn = (e: FocusEvent) => {
      if (isField(e.target)) keyboard = true;
    };
    const onFocusOut = (e: FocusEvent) => {
      if (isField(e.target)) healSoon();
    };
    // The visible screen grows again when the keyboard goes down, even if no field lost the focus.
    const vv = window.visualViewport;
    let lastHeight = vv?.height ?? 0;
    const onResize = () => {
      if (!vv) return;
      if (vv.height < lastHeight - 40) keyboard = true;
      else if (vv.height > lastHeight + 40) healSoon();
      lastHeight = vv.height;
    };
    // Left with the keyboard up and brought back: the screen may still be short.
    const onVisible = () => {
      if (document.visibilityState === 'visible') healSoon();
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    vv?.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      vv?.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return null;
}
