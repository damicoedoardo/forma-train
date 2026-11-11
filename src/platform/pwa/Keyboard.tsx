'use client';

import { useEffect } from 'react';

/** A text field: focusing one brings the keyboard up. */
const isField = (el: Element | null) => el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA)$/.test(el.tagName));

/**
 * Tells the page where the keyboard is, so a screen can sit right on top of it (the coach chat).
 *
 * While a field is focused and the keyboard is up, `<html>` gets `data-keyboard`, `--vvh` is the
 * height left above the keyboard and `--vvtop` how far the phone slid the page up. `.kb-fit`
 * (globals.css) uses them; the tab bar hides.
 */
export function Keyboard() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    // The tallest the screen has been with no field in use. Some iPhones shrink the whole page
    // with the keyboard, so `innerHeight` alone can miss it; this catches both.
    let full = vv.height;
    const sync = () => {
      const typing = isField(document.activeElement);
      if (!typing) full = Math.max(full, vv.height);
      const up = typing && (window.innerHeight - vv.height > 120 || full - vv.height > 120);
      root.style.setProperty('--vvh', `${Math.round(vv.height)}px`);
      root.style.setProperty('--vvtop', `${Math.round(vv.offsetTop)}px`);
      root.toggleAttribute('data-keyboard', up);
    };
    sync();
    // A turned phone has another full height.
    const turn = () => {
      full = 0;
      window.setTimeout(sync, 300);
    };
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    window.addEventListener('orientationchange', turn);
    document.addEventListener('focusin', sync);
    document.addEventListener('focusout', sync);
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
      window.removeEventListener('orientationchange', turn);
      document.removeEventListener('focusin', sync);
      document.removeEventListener('focusout', sync);
      root.removeAttribute('data-keyboard');
    };
  }, []);
  return null;
}
