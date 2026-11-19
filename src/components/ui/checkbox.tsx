'use client';

import type { ComponentProps } from 'react';
import { Toggle } from '@animate-ui/react/primitives/base-ui/toggle';
import { useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import { cn } from '@/lib/utils';
import { Check as CheckIcon } from '../icons/check';

type CheckboxProps = Omit<ComponentProps<'button'>, 'value'> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

// Consent Toggle renders a style-free labeled button. Base UI Checkbox emits an
// inline-styled form input during server rendering.
export function Checkbox({ className, checked, onCheckedChange, ...props }: CheckboxProps) {
  const reduceMotion = useShouldReduceMotion();

  return (
    <Toggle
      {...props}
      render={<button />}
      role="checkbox"
      aria-checked={checked}
      aria-pressed={undefined}
      pressed={checked}
      onPressedChange={onCheckedChange}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (event.key === 'Enter') event.preventDefault();
      }}
      data-slot="checkbox"
      className={cn(
        'peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-foreground dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:aria-checked:bg-primary',
        className,
      )}
    >
      {checked && (
        <span
          data-slot="checkbox-indicator"
          className="grid place-content-center text-current transition-none"
        >
          <CheckIcon className="size-3.5" aria-hidden="true" animate={!reduceMotion} />
        </span>
      )}
    </Toggle>
  );
}
