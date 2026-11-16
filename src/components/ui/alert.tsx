import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AnimateIcon } from '@animate-ui/react/icons';

const alertVariants = cva(
  'relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        success:
          'border-success-border bg-success-soft text-foreground [&>svg]:text-success *:data-[slot=alert-title]:line-clamp-none',
        result:
          'border-primary/20 bg-primary/5 px-5 py-4 text-left text-foreground gap-y-1 has-[>svg]:grid-cols-[2rem_minmax(0,1fr)] has-[>svg]:gap-x-4 [&>svg]:row-span-2 [&>svg]:size-8 [&>svg]:self-center [&>svg]:translate-y-0 [&>svg]:text-primary *:data-[slot=alert-title]:line-clamp-none *:data-[slot=alert-title]:text-lg *:data-[slot=alert-title]:font-semibold',
        destructive:
          'bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 [&>svg]:text-current',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

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
