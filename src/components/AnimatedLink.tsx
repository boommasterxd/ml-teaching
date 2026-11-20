'use client';

import type { ComponentProps } from 'react';
import Link from './IntentLink';
import { Button } from './ui/button';

type AnimatedLinkProps = ComponentProps<typeof Link> &
  Pick<ComponentProps<typeof Button>, 'variant' | 'size'>;

/** Native Next navigation with the same press and icon feedback as shared buttons. */
export default function AnimatedLink({
  variant,
  size,
  className,
  children,
  ...props
}: AnimatedLinkProps) {
  return (
    <Button variant={variant} size={size} className={className} render={<Link {...props} />}>
      {children}
    </Button>
  );
}
