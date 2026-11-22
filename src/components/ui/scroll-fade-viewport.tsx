'use client';

import { useRef } from 'react';
import { useScrollFade } from '@animate-ui/react/primitives/effects/scroll-fade';
import { useRender } from '@base-ui/react/use-render';

const edgeSize = 24;

/** Keep overflow in CSS so static markup does not need Animate UI's inline styles. */
export function ScrollFadeViewport({
  render,
  enabled = true,
  ...props
}: useRender.ComponentProps<'div'> & { enabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollFade(ref, { enabled, size: edgeSize, shrink: 0, blur: 2 });
  return useRender({
    defaultTagName: 'div',
    ref,
    render,
    props: { 'data-scroll-fade': '', ...props },
  });
}
