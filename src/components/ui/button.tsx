'use client';

import type { ComponentProps, ReactElement } from 'react';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import type { VariantProps } from 'class-variance-authority';
import { ActionFeedback } from './action-feedback';
import { cn } from '@/lib/utils';
import { buttonVariants } from '../button-variants';

interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  focusableWhenDisabled?: boolean;
  render?: ReactElement;
  tapScale?: number;
}

export function Button({
  variant = 'default',
  size = 'default',
  className,
  children,
  disabled,
  focusableWhenDisabled,
  render,
  role,
  tapScale,
  ...props
}: ButtonProps) {
  return (
    <ActionFeedback disabled={disabled} tapScale={tapScale}>
      <ButtonPrimitive
        render={render}
        nativeButton={!render}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        disabled={disabled}
        focusableWhenDisabled={focusableWhenDisabled}
        aria-disabled={disabled}
        role={role}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </ButtonPrimitive>
    </ActionFeedback>
  );
}
