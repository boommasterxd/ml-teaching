import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const headingClasses = {
  h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight text-balance',
  h2: 'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
  h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
  h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
} as const;

/** Composes the official shadcn Typography examples; the hero is an explicit display role. */
export function Heading({
  as: Tag = 'h2',
  variant = 'default',
  className,
  ...props
}: ComponentProps<'h2'> & {
  as?: keyof typeof headingClasses;
  variant?: 'default' | 'hero' | 'document';
}) {
  return (
    <Tag
      data-slot="heading"
      data-variant={variant}
      className={cn(
        headingClasses[Tag],
        variant === 'hero' && 'hero-title',
        variant === 'document' && 'document-title',
        className,
      )}
      {...props}
    />
  );
}

export function Text({
  variant = 'default',
  className,
  ...props
}: ComponentProps<'p'> & { variant?: 'default' | 'lead' | 'muted' | 'small' }) {
  return (
    <p
      data-slot="text"
      className={cn(
        {
          default: 'leading-7',
          lead: 'text-xl text-muted-foreground',
          muted: 'text-sm text-muted-foreground',
          small: 'text-sm font-medium leading-none',
        }[variant],
        className,
      )}
      {...props}
    />
  );
}
