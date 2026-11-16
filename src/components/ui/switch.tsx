'use client';

import { startTransition, useEffect, useState, type ComponentProps } from 'react';
import { Switch as SwitchPrimitive } from '@animate-ui/react/primitives/radix-ui/switch';
import { cn } from '@/lib/utils';
import { ActionFeedback } from './action-feedback';
import { useControlRef } from './use-control-ref';

const thumbClass =
  'pointer-events-none grid size-5 place-items-center rounded-full bg-background text-foreground shadow-sm data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 [&_svg]:size-3.5';

/** shadcn Switch composition; Animate UI owns thumb movement and whole-control feedback. */
export function Switch({
  className,
  children,
  disabled,
  checked,
  defaultChecked,
  onCheckedChange,
  asChild,
  ref,
  ...props
}: ComponentProps<typeof SwitchPrimitive.Root>) {
  const [client, setClient] = useState(false);
  const controlRef = useControlRef(ref, client);
  const [initialChecked, setInitialChecked] = useState(defaultChecked ?? false);
  // Replay pending input before upgrading the static control to its animated primitive.
  useEffect(() => {
    startTransition(() => setClient(true));
  }, []);
  const classes = cn(
    'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-input p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary',
    className,
  );
  const value = checked ?? initialChecked;
  const state = value ? 'checked' : 'unchecked';
  // Radix assumes a form before its ref mounts and emits an inline-styled BubbleInput during SSR.
  if (!client)
    return (
      <button
        {...props}
        ref={controlRef}
        type="button"
        role="switch"
        data-slot="switch"
        disabled={disabled}
        aria-checked={value}
        data-state={state}
        className={classes}
        onClick={(event) => {
          props.onClick?.(event);
          if (event.defaultPrevented) return;
          const next = !value;
          if (checked === undefined) setInitialChecked(next);
          onCheckedChange?.(next);
        }}
      >
        <span data-slot="switch-thumb" data-state={state} className={thumbClass}>
          {children}
        </span>
      </button>
    );
  return (
    <ActionFeedback disabled={disabled}>
      <SwitchPrimitive.Root
        ref={controlRef}
        data-slot="switch"
        disabled={disabled}
        checked={checked}
        defaultChecked={initialChecked}
        onCheckedChange={onCheckedChange}
        asChild={asChild}
        className={classes}
        {...props}
      >
        <SwitchPrimitive.Thumb data-slot="switch-thumb" className={thumbClass}>
          {children}
        </SwitchPrimitive.Thumb>
      </SwitchPrimitive.Root>
    </ActionFeedback>
  );
}
