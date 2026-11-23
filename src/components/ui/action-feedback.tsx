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
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  function clearPointerFeedback() {
    setHovered(false);
    setPressed(false);
  }

  return (
    <AnimateIcon
      animate={!disabled && (focused || hovered || pressed)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
      onPointerEnter={(event) => setHovered(event.pointerType !== 'touch')}
      onPointerLeave={clearPointerFeedback}
      onPointerDown={(event) => {
        if (event.isPrimary && event.button === 0) setPressed(true);
      }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={clearPointerFeedback}
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
