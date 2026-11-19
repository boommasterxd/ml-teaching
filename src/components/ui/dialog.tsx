'use client';

import {
  cloneElement,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Dialog as DialogPrimitive } from '@animate-ui/react/primitives/base-ui/dialog';
import { useRender } from '@base-ui/react/use-render';
import { useIsPresent } from 'motion/react';
import { RemoveScroll } from 'react-remove-scroll';
import { cn } from '@/lib/utils';

// Adapted from shadcn/ui's Base UI Dialog; the viewport supports tall mobile content.
export const dialogSurface =
  'relative my-auto grid max-h-fit w-full gap-4 rounded-(--glass-radius) border border-(--glass-line) [background:var(--glass-surface)] p-6 text-foreground shadow-(--glass-highlight) outline-none';
const dialogViewport =
  'pointer-events-auto fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain p-4';
export const dialogScrim = 'pointer-events-none fixed inset-0 z-50 bg-media-overlay';

function getDialogTabStops(dialog: HTMLDialogElement) {
  return Array.from(
    dialog.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]'),
  ).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(':disabled') &&
      !element.closest('[inert]') &&
      element.getClientRects().length > 0,
  );
}

function wrapDialogTab(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.defaultPrevented || event.key !== 'Tab') return;
  const tabStops = getDialogTabStops(event.currentTarget);
  const first = tabStops[0];
  const last = tabStops.at(-1);
  if (!first || !last || event.target !== (event.shiftKey ? first : last)) return;
  // Keep the established wrap at the edges; native modality handles the rest.
  event.preventDefault();
  (event.shiftKey ? last : first).focus();
}

export const Dialog = DialogPrimitive.Root;
export const DialogPortal = DialogPrimitive.Portal;

export function DialogBackdrop() {
  return <DialogPrimitive.Backdrop className={dialogScrim} aria-hidden="true" />;
}

export function renderDialogSurface(element: ReactElement<ComponentProps<'div'>>) {
  return (props: ComponentProps<'div'>, { open }: { open: boolean }) =>
    cloneElement(element, {
      ...props,
      inert: !open || undefined,
      'aria-hidden': !open || undefined,
    });
}

export function DialogContent({
  className,
  render,
  ...props
}: Omit<ComponentProps<typeof DialogPrimitive.Popup>, 'className' | 'render'> & {
  className?: string;
  render: ReactElement<{ className?: string }>;
}) {
  return (
    <DialogPrimitive.Popup
      data-slot="dialog-content"
      className={cn(dialogSurface, className, render.props.className)}
      render={renderDialogSurface(render)}
      {...props}
    />
  );
}

// Base UI Popup requires a portal, which cannot render the already-visible SSG dialog.
export function InitialDialog({ children, ...props }: ComponentProps<'dialog'>) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog?.showModal) return;
    const focused = document.activeElement;
    const initialFocus =
      focused instanceof HTMLElement && dialog.contains(focused)
        ? focused
        : getDialogTabStops(dialog)[0];
    // Upgrade the server-rendered open dialog to modal on the same element, before paint.
    dialog.removeAttribute('open');
    dialog.showModal();
    initialFocus?.focus({ preventScroll: true });
    return () => dialog.close();
  }, []);

  return (
    <RemoveScroll ref={ref} forwardProps removeScrollBar={false} inert={false} allowPinchZoom>
      <dialog
        {...props}
        open
        onKeyDown={wrapDialogTab}
        data-slot="dialog-overlay"
        className={cn(
          dialogViewport,
          'm-0 h-full max-h-none w-full max-w-none bg-transparent backdrop:bg-transparent',
        )}
      >
        <div className={cn(dialogScrim, 'z-auto')} aria-hidden="true" />
        {children}
      </dialog>
    </RemoveScroll>
  );
}

export function InitialDialogContent({ render }: { render: ReactElement<{ className?: string }> }) {
  return useRender({
    defaultTagName: 'div',
    props: { 'data-slot': 'dialog-content', className: cn(dialogSurface, render.props.className) },
    render,
  });
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
}: Omit<ComponentProps<typeof DialogPrimitive.Description>, 'className'> & { className?: string }) {
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
}: Omit<ComponentProps<typeof DialogPrimitive.Title>, 'className'> & {
  icon?: ReactNode;
  className?: string;
}) {
  const title = (
    <DialogPrimitive.Title
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  );
  return <DialogHeading icon={icon}>{title}</DialogHeading>;
}

export function DialogHeading({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  if (!icon) return children;
  return (
    <div className="flex items-baseline gap-2">
      <span
        aria-hidden="true"
        className="inline-flex shrink-0 translate-y-px text-muted-foreground [&_svg]:size-4"
      >
        {icon}
      </span>
      {children}
    </div>
  );
}

export function DialogViewport({
  className,
  children,
  lockScroll = false,
  ...props
}: ComponentProps<'div'> & { lockScroll?: boolean }) {
  const present = useIsPresent();
  return (
    <RemoveScroll
      enabled={lockScroll && present}
      forwardProps
      removeScrollBar={false}
      inert={false}
      allowPinchZoom
    >
      <div
        data-slot="dialog-viewport"
        className={cn(dialogViewport, !present && 'pointer-events-none', className)}
        {...props}
      >
        {children}
      </div>
    </RemoveScroll>
  );
}
