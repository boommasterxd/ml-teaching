'use client';

import type { ComponentProps, ReactNode } from 'react';
import { Dialog as NativeDialog } from 'radix-ui';
import { Dialog as DialogPrimitive } from '@animate-ui/react/primitives/radix-ui';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { RemoveScroll } from 'react-remove-scroll';
import { cn } from '@/lib/utils';

// Adapted from shadcn/ui's Radix Dialog; the overlay supports tall mobile content.
export const Dialog = DialogPrimitive.Root;
export function DialogContent({
  initialContent = false,
  className,
  ...props
}: ComponentProps<typeof NativeDialog.Content> & { initialContent?: boolean }) {
  // The initially visible consent dialog keeps its style-free Radix hydration path.
  const Content = initialContent ? NativeDialog.Content : DialogPrimitive.Content;
  return (
    <Content
      data-slot="dialog-content"
      className={cn(
        'relative my-auto grid max-h-fit w-full gap-4 rounded-(--glass-radius) border border-(--glass-line) [background:var(--glass-surface)] p-6 text-foreground shadow-(--glass-highlight) outline-none',
        className,
      )}
      {...props}
    />
  );
}
export function DialogFooter({
  className,
  layout = 'default',
  ...props
}: ComponentProps<'div'> & { layout?: 'default' | 'auto-fit' }) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'grid gap-3',
        layout === 'auto-fit'
          ? 'grid-cols-[repeat(auto-fit,minmax(min(100%,7.5rem),1fr))]'
          : 'grid-cols-1 sm:grid-cols-2',
        className,
      )}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function DialogTitle({
  icon,
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title> & { icon?: ReactNode }) {
  const title = (
    <DialogPrimitive.Title
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  );
  if (!icon) return title;
  return (
    <div className="flex items-baseline gap-2">
      <span
        aria-hidden="true"
        className="inline-flex shrink-0 translate-y-px text-muted-foreground [&_svg]:size-4"
      >
        {icon}
      </span>
      {title}
    </div>
  );
}

export function DialogOverlay({
  className,
  children,
  animateEntry = true,
  ...props
}: ComponentProps<'div'> & { animateEntry?: boolean }) {
  const scrimClasses = 'pointer-events-none fixed inset-0 bg-media-overlay';
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
        {animateEntry ? (
          <Effect fade className={scrimClasses} aria-hidden="true" />
        ) : (
          <div className={scrimClasses} aria-hidden="true" />
        )}
        {children}
      </div>
    </RemoveScroll>
  );
}
