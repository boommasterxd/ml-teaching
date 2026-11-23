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
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import {
  motionTokens,
  useShouldReduceMotion,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';
import { useRender } from '@base-ui/react/use-render';
import { useIsPresent } from 'motion/react';
import { RemoveScroll } from 'react-remove-scroll';
import { cn } from '@/lib/utils';
import { ScrollFadeViewport } from './scroll-fade-viewport';

// Adapted from shadcn/ui's Base UI Dialog; only DialogBody scrolls.
export const dialogSurface =
  'relative flex max-h-(--dialog-height) w-full flex-col gap-[min(var(--dialog-gap),4dvh)] rounded-(--glass-radius) border border-(--glass-line) [background:var(--glass-surface)] px-(--dialog-padding) py-(--dialog-block-padding) text-foreground shadow-(--glass-highlight) outline-none [--dialog-block-padding:min(var(--dialog-padding),5dvh)] [--dialog-gap:1rem] [--dialog-height:calc(100dvh-2*var(--dialog-inset))] [--dialog-padding:1.5rem]';
const dialogViewportLayout =
  'flex items-center justify-center overflow-clip px-4 py-(--dialog-inset) [--dialog-inset:min(1rem,4dvh)]';
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
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={dialogScrim}
      transition={{ duration: 0 }}
      exitTransition={motionTokens.transition.overlay}
      aria-hidden="true"
    />
  );
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
export function InitialDialog({
  children,
  suppressForRememberedTrainingConsent = false,
  ...props
}: ComponentProps<'dialog'> & { suppressForRememberedTrainingConsent?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const present = useIsPresent();
  const reduceMotion = useShouldReduceMotion();
  const exitTransition = useTempoTransition(motionTokens.transition.overlay);
  useLayoutEffect(() => {
    const initialLabel = ref.current?.getAttribute('aria-labelledby');
    let attached = true;
    let promoted: HTMLDialogElement | undefined;
    function promote() {
      const dialog = ref.current;
      if (!attached || !dialog?.isConnected || !dialog.showModal) return;
      const focused = document.activeElement;
      const label = dialog.getAttribute('aria-labelledby');
      const activeTitle = label && label !== initialLabel ? document.getElementById(label) : null;
      const initialFocus =
        activeTitle ??
        (focused instanceof HTMLElement && dialog.contains(focused)
          ? focused
          : getDialogTabStops(dialog)[0]);
      // Upgrade the server-rendered open dialog without replacing its controls.
      dialog.removeAttribute('open');
      dialog.showModal();
      promoted = dialog;
      initialFocus?.focus({ preventScroll: true });
    }
    if (
      suppressForRememberedTrainingConsent &&
      document.documentElement.dataset.trainingConsent === 'remembered'
    ) {
      // Let restored consent select the current step before promoting the live dialog.
      queueMicrotask(promote);
    } else promote();
    return () => {
      attached = false;
      promoted?.close();
    };
  }, [suppressForRememberedTrainingConsent]);

  return (
    <RemoveScroll ref={ref} forwardProps removeScrollBar={false} inert={false} allowPinchZoom>
      <Effect
        asChild
        fade
        initial={false}
        animate={undefined}
        transition={reduceMotion ? { duration: 0 } : exitTransition}
      >
        <dialog
          {...props}
          open
          inert={!present || undefined}
          aria-hidden={!present || undefined}
          onKeyDown={wrapDialogTab}
          data-open={present ? '' : undefined}
          data-closed={present ? undefined : ''}
          data-slot="dialog-overlay"
          data-initial-training-consent={suppressForRememberedTrainingConsent || undefined}
          className="pointer-events-auto fixed inset-x-0 top-0 z-50 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden overscroll-contain bg-transparent backdrop:bg-transparent"
        >
          <div className={cn(dialogScrim, 'z-auto')} aria-hidden="true" />
          <div className={cn('relative size-full', dialogViewportLayout)}>{children}</div>
        </dialog>
      </Effect>
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

export function DialogBody({ className, ...props }: ComponentProps<'div'>) {
  const present = useIsPresent();
  return (
    <ScrollFadeViewport
      enabled={present}
      data-slot="dialog-body"
      className={cn(
        '-mx-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain px-1 focus-visible:-outline-offset-4',
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
        'grid shrink-0 gap-3',
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
        className={cn(
          'pointer-events-auto fixed inset-x-0 top-0 z-50 h-dvh',
          dialogViewportLayout,
          !present && 'pointer-events-none',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </RemoveScroll>
  );
}
