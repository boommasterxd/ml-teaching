'use client';

import type { ComponentProps } from 'react';
import { Switch as SwitchPrimitive } from '@animate-ui/react/primitives/radix-ui/switch';
import { cn } from '@/lib/utils';
import { ActionFeedback } from './action-feedback';
import { useControlHydrated, useControlRef } from './use-control-hydration';

const thumbClass =
  'pointer-events-none grid place-items-center rounded-full bg-background ring-0 group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground [&_svg]:size-3';

/** Public Radix parts keep the trigger stable and omit the inline-styled SSR form bridge. */
export function Switch({
  className,
  children,
  disabled,
  checked,
  defaultChecked,
  onCheckedChange,
  name,
  form,
  required,
  value,
  asChild,
  ref,
  size = 'default',
  ...props
}: ComponentProps<typeof SwitchPrimitive.Root> & { size?: 'default' | 'sm' }) {
  const client = useControlHydrated();
  const controlRef = useControlRef(ref);
  return (
    <SwitchPrimitive.unstable_Provider
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      name={name}
      form={form}
      required={required}
      value={value}
    >
      <ActionFeedback disabled={disabled}>
        <SwitchPrimitive.unstable_Trigger
          ref={controlRef}
          data-slot="switch"
          data-size={size}
          asChild={asChild}
          className={cn(
            'peer group/switch inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-[1.15rem] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80',
            className,
          )}
          {...props}
        >
          <SwitchPrimitive.Thumb data-slot="switch-thumb" className={thumbClass}>
            {children}
          </SwitchPrimitive.Thumb>
        </SwitchPrimitive.unstable_Trigger>
      </ActionFeedback>
      {client && Boolean(name || form || required) && <SwitchPrimitive.unstable_BubbleInput />}
    </SwitchPrimitive.unstable_Provider>
  );
}
