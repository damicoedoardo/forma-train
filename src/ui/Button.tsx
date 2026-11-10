import type { ButtonHTMLAttributes } from 'react';

type Kind = 'primary' | 'glass';

const KIND: Record<Kind, string> = {
  primary: 'bg-ink text-base',
  glass: 'glass text-ink',
};

/** A pill button, 56px tall. `primary` is the screen's one main action; everything else is `glass`. */
export function Button({ kind = 'primary', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: Kind }) {
  return (
    <button
      type="button"
      className={`flex h-14 items-center justify-center gap-2 rounded-pill px-6 text-[17px] font-medium transition-opacity active:opacity-80 disabled:opacity-40 ${KIND[kind]} ${className}`}
      {...rest}
    />
  );
}
