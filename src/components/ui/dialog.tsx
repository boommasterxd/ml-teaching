'use client';

import type { ComponentProps } from 'react';
import { Dialog as DialogPrimitive } from '@animate-ui/react/primitives/radix-ui';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { RemoveScroll } from 'react-remove-scroll';
import { cn } from '@/lib/utils';

// Adapted from shadcn/ui's Radix Dialog; the overlay supports tall mobile content.
export const Dialog = DialogPrimitive.Root;
export const DialogContent = DialogPrimitive.Content;
const titleClasses = {
  default: 'text-xl',
  compact: 'text-sm',
  large: 'text-2xl',
} as const;

export function DialogTitle({
  variant = 'default',
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title> & { variant?: keyof typeof titleClasses }) {
  return (
    <DialogPrimitive.Title
      className={cn('font-bold text-foreground', titleClasses[variant], className)}
      {...props}
    />
  );
}

export function DialogOverlay({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <RemoveScroll forwardProps removeScrollBar={false} inert={false} allowPinchZoom>
      <div
        data-slot="dialog-overlay"
        className={cn(
          'pointer-events-auto fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain p-4',
          className,
        )}
        {...props}
      >
        <Effect
          fade
          className="pointer-events-none fixed inset-0 bg-zinc-900/80"
          aria-hidden="true"
        />
        {children}
      </div>
    </RemoveScroll>
  );
}
