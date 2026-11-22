'use client';

import type { ComponentProps, ReactElement } from 'react';
import { AlertDialog as Primitive } from '@animate-ui/react/primitives/base-ui/alert-dialog';
import { cn } from '@/lib/utils';
import { DialogExitObserver, useDialogExitCallback } from '../dialog-state';
import { Button } from './button';
import { dialogScrim, dialogSurface, DialogViewport, renderDialogSurface } from './dialog';

// Base Nova Alert Dialog with the shared glass surface and Animate UI's portal lifecycle.
export const AlertDialog = Primitive.Root;

export function AlertDialogContent({
  className,
  render,
  onExited,
  ...props
}: Omit<Primitive.Popup.Props, 'className' | 'render'> & {
  className?: string;
  render: ReactElement<ComponentProps<'div'>>;
  onExited?: () => void;
}) {
  const exitCallback = useDialogExitCallback(onExited);
  return (
    <Primitive.Portal>
      {onExited && <DialogExitObserver callback={exitCallback} />}
      <Primitive.Backdrop
        data-slot="alert-dialog-overlay"
        className={dialogScrim}
        aria-hidden="true"
      />
      <DialogViewport>
        <Primitive.Popup
          data-slot="alert-dialog-content"
          className={cn(dialogSurface, className, render.props.className)}
          render={renderDialogSurface(render)}
          {...props}
        />
      </DialogViewport>
    </Primitive.Portal>
  );
}

export const AlertDialogTitle = Primitive.Title;
export const AlertDialogDescription = Primitive.Description;

export function AlertDialogCancel(props: Omit<Primitive.Close.Props, 'render'>) {
  return (
    <Primitive.Close
      data-slot="alert-dialog-cancel"
      render={<Button variant="secondary" />}
      {...props}
    />
  );
}

export function AlertDialogAction(props: ComponentProps<typeof Button>) {
  return <Button data-slot="alert-dialog-action" variant="destructive" {...props} />;
}
