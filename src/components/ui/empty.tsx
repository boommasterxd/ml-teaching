import { cn } from '@/lib/utils';

function Empty({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & { variant?: 'default' | 'gallery' }) {
  return (
    <div
      data-slot="empty"
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl text-center text-balance',
        variant === 'gallery'
          ? 'h-full gap-2 px-4'
          : 'gap-6 border border-dashed bg-card p-6 md:p-12',
        className,
      )}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-header"
      className={cn('flex max-w-sm flex-col items-center gap-2 text-center', className)}
      {...props}
    />
  );
}

function EmptyMedia({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-media"
      className={cn('text-muted-foreground/40 [&_svg]:size-6', className)}
      {...props}
    />
  );
}

function EmptyDescription({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'p'> & { variant?: 'default' | 'compact' }) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        'text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary',
        variant === 'compact' ? 'text-xs' : 'text-sm/relaxed',
        className,
      )}
      {...props}
    />
  );
}

export { Empty, EmptyHeader, EmptyMedia, EmptyDescription };
