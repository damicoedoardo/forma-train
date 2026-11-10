import type { ComponentPropsWithoutRef, ElementType } from 'react';

type Props<T extends ElementType> = { as?: T; className?: string } & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>;

/** The one surface: a frosted glass card. Rounded 24px unless `className` says otherwise. */
export function Glass<T extends ElementType = 'div'>({ as, className = '', ...rest }: Props<T>) {
  const Tag = (as ?? 'div') as ElementType;
  return <Tag className={`glass rounded-card ${className}`} {...rest} />;
}
