/**
 * Reusable button component with variant and size props.
 * Covers primary, secondary, destructive, and call-to-action use cases.
 * Uses class-variance-authority for type-safe variant composition.
 */
import type React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center',
  {
    variants: {
      variant: {
        primary:
          'bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        secondary:
          'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
        destructive:
          'bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
        cta:
          'bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold shadow-lg shadow-red-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-red-600',
      },
      size: {
        sm: 'py-2 px-3 text-sm',
        md: 'py-3 px-4 text-sm',
        lg: 'py-4 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/** Renders a styled button element with configurable variant and size. */
export default function Button({
  variant,
  size,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      aria-disabled={disabled}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
