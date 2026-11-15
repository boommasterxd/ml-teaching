import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20',
  {
    variants: {
      variant: {
        default: 'h-9',
        'class-name':
          'h-auto border-0 border-b border-transparent rounded-none p-0 font-semibold text-sm text-foreground shadow-none focus-visible:border-ring aria-invalid:text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

/** shadcn/ui Input, sharing the application's existing cn utility and focus tokens. */
export function Input({
  className,
  type,
  variant,
  ...props
}: ComponentProps<'input'> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  );
}
