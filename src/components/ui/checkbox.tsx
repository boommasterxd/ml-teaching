'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check as CheckIcon } from '../icons';
import { Checkbox as CheckboxPrimitive } from '@animate-ui/react/primitives/radix-ui';
import { useControlRef } from './use-control-ref';

function Checkbox({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  asChild,
  ref,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  const [client, setClient] = React.useState(false);
  const controlRef = useControlRef(ref, client);
  // Replay pending input before upgrading the static control to its animated primitive.
  React.useEffect(() => {
    React.startTransition(() => setClient(true));
  }, []);
  const [initialChecked, setInitialChecked] = React.useState(defaultChecked ?? false);
  const classes = cn(
    'peer inline-flex size-5 shrink-0 items-center justify-center rounded border border-control outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
    className,
  );
  const value = checked ?? initialChecked;
  if (!client)
    return (
      <button
        {...props}
        ref={controlRef}
        type="button"
        role="checkbox"
        data-slot="checkbox"
        data-state={value === 'indeterminate' ? 'indeterminate' : value ? 'checked' : 'unchecked'}
        aria-checked={value === 'indeterminate' ? 'mixed' : value}
        className={classes}
        onClick={(event) => {
          props.onClick?.(event);
          if (event.defaultPrevented) return;
          const next = value === 'indeterminate' || !value;
          if (checked === undefined) setInitialChecked(next);
          onCheckedChange?.(next);
        }}
      >
        {value && <CheckIcon className="size-3.5" aria-hidden="true" />}
      </button>
    );
  return (
    <CheckboxPrimitive.Root
      ref={controlRef}
      data-slot="checkbox"
      className={classes}
      checked={checked}
      defaultChecked={initialChecked}
      onCheckedChange={onCheckedChange}
      asChild={asChild}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
