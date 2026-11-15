'use client';

import type { ButtonHTMLAttributes } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { ActionFeedback } from './action-feedback';
import { cn } from '@/lib/utils';
import { buttonVariants } from '../button-variants';

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ variant, size, className, children, disabled, ...props }: ButtonProps) {
  return (
    <ActionFeedback disabled={disabled}>
      <button
        data-slot="button"
        disabled={disabled}
        aria-disabled={disabled}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </button>
    </ActionFeedback>
  );
}
