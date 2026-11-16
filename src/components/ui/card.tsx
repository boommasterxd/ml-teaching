import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { AnimateIcon } from '@animate-ui/react/icons';

const cardVariants = cva(
  'flex flex-col gap-0 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: 'border-border/80',
        open: 'rounded-none border-0 bg-transparent p-0 shadow-none',
        classification: 'border-input hover:shadow-md',
        feature: 'rounded-3xl border-border p-8',
        explanation: 'relative group rounded-3xl border-border bg-muted/50 p-8 hover:shadow-md',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Card({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof cardVariants>) {
  return (
    <AnimateIcon animateOnHover animateOnTap className="contents">
      <div data-slot="card" className={cn(cardVariants({ variant }), className)} {...props} />
    </AnimateIcon>
  );
}

function CardHeader({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & {
  variant?: 'default' | 'classification' | 'feature' | 'steps' | 'explanation';
}) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header flex flex-wrap items-center justify-between gap-2',
        {
          default: 'px-5 py-4',
          classification: 'bg-muted/50 px-4 py-3',
          feature: 'flex-col gap-0 p-0',
          steps: 'flex-col gap-0 p-0 [&>svg]:size-10 [&>svg]:text-muted-foreground/60',
          explanation: 'relative z-10 block p-0',
        }[variant],
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({
  className,
  as: Component = 'h2',
  variant = 'default',
  ...props
}: React.ComponentProps<'h2'> & {
  as?: 'h2' | 'h3';
  variant?: 'default' | 'feature' | 'steps' | 'explanation';
}) {
  return (
    <Component
      data-slot="card-title"
      className={cn(
        'font-bold text-foreground',
        {
          default: 'flex items-center gap-2 text-base [&_svg]:size-4 [&_svg]:text-primary',
          feature: 'text-xl break-words hyphens-auto',
          steps: 'text-xl font-semibold',
          explanation: 'text-2xl',
        }[variant],
        className,
      )}
      {...props}
    />
  );
}

function CardContent({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & {
  variant?: 'default' | 'classification' | 'feature' | 'explanation';
}) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        {
          default: 'p-5',
          classification: 'p-4',
          feature: 'p-0 text-muted-foreground',
          explanation: 'p-0 text-muted-foreground leading-relaxed',
        }[variant],
        className,
      )}
      {...props}
    />
  );
}

function CardIcon({
  className,
  tone = 'primary',
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & {
  tone?: 'primary' | 'success' | 'warning' | 'accent' | 'destructive';
  variant?: 'default' | 'standalone';
}) {
  const tones = {
    primary: 'bg-primary-soft text-primary',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    accent: 'bg-accent-soft text-accent-strong',
    destructive: 'bg-destructive-soft text-destructive',
  };
  return (
    <div
      aria-hidden="true"
      data-slot="card-icon"
      className={cn(
        'flex items-center justify-center',
        tones[tone],
        variant === 'standalone'
          ? 'size-12 bg-transparent [&_svg]:size-12'
          : 'size-16 rounded-2xl [&_svg]:size-8',
        className,
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardContent, CardIcon };
