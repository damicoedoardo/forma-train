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
    const sync = () => {
      const up = window.innerHeight - vv.height > 120 && isField(document.activeElement);
      root.style.setProperty('--vvh', `${Math.round(vv.height)}px`);
      root.style.setProperty('--vvtop', `${Math.round(vv.offsetTop)}px`);
      root.toggleAttribute('data-keyboard', up);
    };
    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    document.addEventListener('focusin', sync);
    document.addEventListener('focusout', sync);
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
      document.removeEventListener('focusin', sync);
      document.removeEventListener('focusout', sync);
      root.removeAttribute('data-keyboard');
    };
  }, []);
  return null;
}
