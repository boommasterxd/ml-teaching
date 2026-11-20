'use client';

import { useState, type ReactElement } from 'react';
import { Button as ButtonPrimitive } from '@animate-ui/react/primitives/buttons/button';
import { AnimateIcon } from '@animate-ui/react/icons';
import { motionTokens } from '@animate-ui/react/utils/motion';
import { useMotionPreference } from './use-motion-preference';

/** Keep Animate UI's press Slot and use Motion's numeric scale of 1 at rest. */
export function ActionFeedback({
  children,
  disabled,
  tapScale,
}: {
  children: ReactElement;
  disabled?: boolean;
  tapScale?: number;
}) {
  const { reduce } = useMotionPreference();
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
        whileTap={disabled || reduce ? undefined : { scale: tapScale ?? motionTokens.scale.press }}
      >
        {children}
      </ButtonPrimitive>
    </AnimateIcon>
  );
}
