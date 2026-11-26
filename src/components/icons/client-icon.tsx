'use client';

import type { ComponentType } from 'react';
import type { IconProps } from '@animate-ui/react/icons';
import type { LucideIcon } from 'lucide-react';

import { useMotionStart } from '../ui/use-motion-start';

/** Motion's initial style attributes are excluded from strict-CSP static HTML. */
export function clientIcon<T extends string>(
  Animated: ComponentType<IconProps<T>>,
  Fallback: LucideIcon,
) {
  return function ClientIcon(props: IconProps<T>) {
    const motionReady = useMotionStart();
    if (motionReady) return <Animated {...props} />;
    const hidden = props['aria-hidden'];

    return (
      <Fallback
        size={props.size ?? 28}
        className={typeof props.className === 'string' ? props.className : undefined}
        aria-hidden={
          hidden === true || hidden === false || hidden === 'true' || hidden === 'false'
            ? hidden
            : undefined
        }
        aria-label={typeof props['aria-label'] === 'string' ? props['aria-label'] : undefined}
        role={typeof props.role === 'string' ? props.role : undefined}
        fill={typeof props.fill === 'string' ? props.fill : 'none'}
        strokeWidth={typeof props.strokeWidth === 'number' ? props.strokeWidth : undefined}
      />
    );
  };
}
