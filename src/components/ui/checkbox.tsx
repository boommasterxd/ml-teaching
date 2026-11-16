'use client';

import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { Check as CheckIcon } from '../icons';
import { Checkbox as CheckboxPrimitive } from '@animate-ui/react/primitives/radix-ui';
import { useControlHydrated, useControlRef } from './use-control-hydration';

function Checkbox({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  name,
  form,
  required,
  disabled,
  value,
  asChild,
  ref,
  ...props
}: ComponentProps<typeof CheckboxPrimitive.Root>) {
  const client = useControlHydrated();
  const controlRef = useControlRef(ref);
  return (
    <CheckboxPrimitive.unstable_Provider
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      name={name}
      form={form}
      required={required}
      value={value}
    >
      <CheckboxPrimitive.unstable_Trigger
        ref={controlRef}
        data-slot="checkbox"
        asChild={asChild}
        className={cn(
          'peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-[state=checked]:bg-primary',
          className,
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          asChild={!client}
          data-slot="checkbox-indicator"
          className="grid place-content-center text-current transition-none"
        >
          <CheckIcon className="size-3.5" aria-hidden="true" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.unstable_Trigger>
      {client && Boolean(name || form || required) && <CheckboxPrimitive.unstable_BubbleInput />}
    </CheckboxPrimitive.unstable_Provider>
  );
}

export { Checkbox };
