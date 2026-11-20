'use client';

import type { ComponentProps } from 'react';
import { Toggle } from '@animate-ui/react/primitives/base-ui/toggle';
import {
  ReducedMotionConfig,
  motionTokens,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { ActionFeedback } from './action-feedback';
import { useControlRef } from './use-control-hydration';

type ToggleProps = ComponentProps<typeof Toggle>;
type SwitchProps = Omit<
  ToggleProps,
  'className' | 'pressed' | 'defaultPressed' | 'onPressedChange' | 'render'
> & {
  className?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: ToggleProps['onPressedChange'];
  size?: 'default' | 'sm';
};

/** A standalone switch uses the Base UI toggle because Switch.Root adds a styled SSR input. */
export function Switch({
  className,
  children,
  disabled,
  checked,
  defaultChecked,
  onCheckedChange,
  ref,
  size = 'default',
  ...props
}: SwitchProps) {
  const transition = useTempoTransition(motionTokens.spring.thumb);
  const controlRef = useControlRef(ref);
  return (
    <ReducedMotionConfig>
      <ActionFeedback disabled={disabled}>
        <Toggle
          {...props}
          ref={controlRef}
          disabled={disabled}
          pressed={checked}
          defaultPressed={defaultChecked}
          onPressedChange={onCheckedChange}
          data-slot="switch"
          data-size={size}
          className={cn(
            'control-focus peer group/switch inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-[1.15rem] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6 data-[state=checked]:justify-end data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80',
            className,
          )}
          render={(buttonProps, { pressed }) => (
            <button
              {...buttonProps}
              role="switch"
              aria-pressed={undefined}
              aria-checked={pressed}
              data-state={pressed ? 'checked' : 'unchecked'}
            >
              <motion.span
                data-slot="switch-thumb"
                layout="position"
                layoutDependency={pressed}
                transition={{ layout: transition }}
                className="pointer-events-none grid place-items-center rounded-full bg-background ring-0 group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 dark:group-data-[state=checked]/switch:bg-primary-foreground dark:group-data-[state=unchecked]/switch:bg-foreground [&_svg]:size-3"
              >
                {children}
              </motion.span>
            </button>
          )}
        />
      </ActionFeedback>
    </ReducedMotionConfig>
  );
}
