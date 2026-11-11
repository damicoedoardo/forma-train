'use client';

import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

/** Puts a sheet or a full page on top of everything, straight in <body>. Inside a screen, the
    entrance animation's transform would make `fixed` stick to that screen instead of the phone,
    so a sheet would open in the wrong place. */
export function Layer({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
