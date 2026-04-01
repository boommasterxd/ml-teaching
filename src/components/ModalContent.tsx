/**
 * Shared wrapper for modal dialog content panels.
 * Provides consistent styling (rounded corners, shadow, max-width) across all modals.
 */
import { cn } from '../lib/utils';

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
} as const;

interface ModalContentProps {
  maxWidth?: keyof typeof maxWidthClasses;
  className?: string;
  children: React.ReactNode;
}

/** Renders the white content card inside a Dialog overlay. */
export default function ModalContent({ maxWidth = 'md', className, children }: ModalContentProps) {
  return (
    <div className={cn(
      'bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-fit w-full',
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}
