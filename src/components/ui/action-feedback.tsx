'use client';

import { useState, useSyncExternalStore, type ReactElement } from 'react';
import { Button as ButtonPrimitive } from '@animate-ui/react/primitives/buttons/button';
import { AnimateIcon } from '@animate-ui/react/icons';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** Keep the press Slot directly on the control and supply its rest transform after hydration. */
export function ActionFeedback({
  children,
  disabled,
}: {
  children: ReactElement;
  disabled?: boolean;
}) {
  const isClient = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const [focused, setFocused] = useState(false);

  return (
    <AnimateIcon
      animate={!disabled && focused}
      animateOnHover={!disabled}
      animateOnTap={!disabled}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
      className="contents"
    >
      <ButtonPrimitive
        asChild
        disabled={disabled}
        initial={false}
        style={isClient ? { transform: 'scale(1)' } : undefined}
      >
        {children}
      </ButtonPrimitive>
    </AnimateIcon>
  );
}
