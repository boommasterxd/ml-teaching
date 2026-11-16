'use client';

import type { ComponentProps } from 'react';
import { Slot } from '@animate-ui/react/primitives/radix-ui';
import type { VariantProps } from 'class-variance-authority';
import { ActionFeedback } from './action-feedback';
import { cn } from '@/lib/utils';
import { buttonVariants } from '../button-variants';

interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  variant = 'default',
  size = 'default',
  asChild = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot.Root : 'button';
  return (
    <ActionFeedback disabled={disabled}>
      <Component
        data-slot="button"
        data-variant={variant}
        data-size={size}
        disabled={disabled}
        aria-disabled={disabled}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </Component>
    </ActionFeedback>
  );
}
