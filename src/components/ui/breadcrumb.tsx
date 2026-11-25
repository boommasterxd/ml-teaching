import type { ComponentProps } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import IntentLink from '@/components/IntentLink';
import { cn } from '@/lib/utils';

function Breadcrumb({ className, ...props }: ComponentProps<'nav'>) {
  return <nav data-slot="breadcrumb" className={cn(className)} {...props} />;
}

function BreadcrumbList({ className, ...props }: ComponentProps<'ol'>) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        'flex flex-wrap items-center gap-1.5 text-sm wrap-break-word text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn('inline-flex min-w-0 items-center gap-1', className)}
      {...props}
    />
  );
}

function BreadcrumbLink({ className, ...props }: ComponentProps<typeof IntentLink>) {
  return (
    <IntentLink
      data-slot="breadcrumb-link"
      className={cn(
        'inline-flex min-h-6 items-center rounded-sm underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn('font-normal text-foreground', className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator() {
  return (
    <span data-slot="breadcrumb-separator" aria-hidden="true" className="shrink-0">
      <ChevronRightIcon className="size-3.5 rtl:rotate-180" />
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
