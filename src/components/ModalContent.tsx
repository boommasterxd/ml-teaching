/**
 * ModalContent.tsx
 *
 * Shared wrapper for modal dialog content panels.
 * Provides consistent styling (rounded corners, shadow, max-width) across all modals.
 */
import type React from 'react';
import { cn } from '../lib/utils';

/** Maps size keys to Tailwind max-width utility classes. */
const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
} as const;

/**
 * Props for the ModalContent component.
 */
interface ModalContentProps extends React.ComponentProps<'div'> {
  /** Controls the maximum width of the content card. Defaults to `'md'`. */
  maxWidth?: keyof typeof maxWidthClasses;
  /** Additional Tailwind classes merged onto the content card. */
  className?: string;
  /** Content rendered inside the modal card. */
  children: React.ReactNode;
}

/**
 * Renders the shared themed content surface inside a Dialog overlay.
 *
 * @param maxWidth - Maximum width variant of the card (`'sm'`, `'md'`, or `'lg'`). Defaults to `'md'`.
 * @param className - Optional additional classes applied to the card wrapper.
 * @param children - Content displayed inside the card.
 */
export default function ModalContent({
  maxWidth = 'md',
  className,
  children,
  ...props
}: ModalContentProps) {
  return (
    <div
      className={cn(
        'relative grid w-full gap-4 rounded-lg border bg-background p-6 text-foreground shadow-lg outline-none my-auto max-h-fit',
        maxWidthClasses[maxWidth],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
