'use client';

import type { ComponentProps } from 'react';
import { AnimateIcon } from '@animate-ui/react/icons';
import { EntryReveal } from '@/components/ui/entry-reveal';

/** Required server content stays visible; only below-fold, hydrated decorations reveal on admission. */
export default function ScrollReveal({
  children,
  className = 'h-full',
  ...props
}: ComponentProps<typeof EntryReveal>) {
  return (
    <AnimateIcon animateOnHover className="contents">
      <EntryReveal className={className} {...props}>
        {children}
      </EntryReveal>
    </AnimateIcon>
  );
}
