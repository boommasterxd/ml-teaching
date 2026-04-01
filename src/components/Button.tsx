/**
 * Button.tsx
 *
 * Reusable button component with variant and size props.
 * Covers primary, secondary, destructive, and call-to-action use cases.
 * Uses class-variance-authority for type-safe variant composition.
 */
import type React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

/**
 * CVA variant configuration for button styles.
 *
 * Variants:
 * - `primary`: Indigo-colored button for main actions; shows a disabled state.
 * - `secondary`: Neutral zinc button for secondary actions.
 * - `destructive`: Red button for irreversible or dangerous actions.
 * - `cta`: Rounded red call-to-action button with a shadow, used on the landing page.
 *
 * Sizes:
 * - `sm`: Small padding, 14 px text.
 * - `md`: Medium padding (default), 14 px text.
 * - `lg`: Large padding, 18 px text.
 */
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

/**
 * Props for the Button component.
 * Extends all native `<button>` HTML attributes with CVA variant and size options.
 */
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/**
 * Renders a styled `<button>` element.
 *
 * Sets both `disabled` and `aria-disabled` when disabled, so the state is
 * conveyed to assistive technologies as well as visually.
 *
 * @param variant - Visual style of the button (`primary` | `secondary` | `destructive` | `cta`). Defaults to `primary`.
 * @param size - Padding and font-size preset (`sm` | `md` | `lg`). Defaults to `md`.
 * @param className - Additional Tailwind classes merged via `cn()`.
 * @param children - Button label or inner content.
 * @param disabled - Disables the button and applies a disabled cursor style.
 */
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
