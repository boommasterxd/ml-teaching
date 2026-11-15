'use client';

import type { ComponentProps } from 'react';
import type { VariantProps } from 'class-variance-authority';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from './button-variants';
import { ActionFeedback } from './ui/action-feedback';

type AnimatedLinkProps = ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>;

/** Native Next navigation with the same press and icon feedback as shared buttons. */
export default function AnimatedLink({
  variant,
  size,
  className,
  children,
  ...props
}: AnimatedLinkProps) {
  return (
    <ActionFeedback>
      <Link className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {children}
      </Link>
    </ActionFeedback>
  );
}
