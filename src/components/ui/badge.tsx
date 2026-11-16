import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Slot } from '@animate-ui/react/primitives/radix-ui';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border border-transparent px-2 py-1 text-xs font-medium whitespace-nowrap focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        pipeline:
          'size-8 rounded-full p-0 font-mono text-xs bg-muted text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=complete]:bg-success-soft data-[state=complete]:text-success',
        'step-neutral': 'bg-muted text-muted-foreground',
        'step-primary': 'bg-primary-soft text-primary',
        'step-destructive': 'bg-destructive-soft text-destructive',
        success: 'border-success-border bg-success-soft text-success',
        count: 'bg-muted text-muted-foreground font-mono',
        warning: 'bg-warning-soft text-warning font-mono font-semibold',
        default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'bg-destructive text-destructive-foreground focus-visible:ring-destructive/20 [a&]:hover:bg-destructive-hover',
        outline:
          'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        ghost: '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 [a&]:hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
    compoundVariants: [
      {
        variant: ['step-neutral', 'step-primary', 'step-destructive'],
        className: 'size-16 rounded-full border-0 p-0 text-2xl font-bold',
      },
    ],
  },
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge };
