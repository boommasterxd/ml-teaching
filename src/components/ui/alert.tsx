import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AnimateIcon } from '@animate-ui/react/icons';

const alertVariants = cva('relative grid w-full border text-sm', {
  variants: {
    variant: {
      default: 'rounded-lg bg-card text-card-foreground [&>svg]:text-current',
      success:
        'success-surface text-foreground [&>svg]:text-success *:data-[slot=alert-title]:line-clamp-none',
      result: 'grid-cols-[minmax(0,1fr)_auto] rounded-2xl border-primary/25',
      achievement: 'success-surface grid-cols-[auto_minmax(0,1fr)]',
      destructive:
        'rounded-lg bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 [&>svg]:text-current',
    },
  },
  compoundVariants: [
    {
      variant: ['default', 'success', 'destructive'],
      className:
        'grid-cols-[0_1fr] items-start gap-y-0.5 px-4 py-3 has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5',
    },
    {
      variant: ['result', 'achievement'],
      className:
        'isolate items-center gap-x-3 gap-y-1 overflow-hidden px-4 py-3 text-left text-foreground *:data-[slot=alert-title]:line-clamp-none *:data-[slot=alert-title]:font-semibold',
    },
  ],
  defaultVariants: {
    variant: 'default',
  },
});

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <AnimateIcon
      animateOnHover
      animateOnTap
      asChild={variant === 'result'}
      className={variant === 'result' ? undefined : 'contents'}
    >
      <div
        data-slot="alert"
        data-variant={variant}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      />
    </AnimateIcon>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
