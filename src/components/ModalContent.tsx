import type React from 'react';
import { cn } from '../lib/utils';

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
} as const;

interface ModalContentProps extends React.ComponentProps<'div'> {
  maxWidth?: keyof typeof maxWidthClasses;
  children: React.ReactNode;
}

/** The same element receives Radix focus, dialog semantics and the product width. */
export default function ModalContent({
  maxWidth = 'md',
  className,
  children,
  ...props
}: ModalContentProps) {
  return (
    <div className={cn(maxWidthClasses[maxWidth], className)} {...props}>
      {children}
    </div>
  );
}
