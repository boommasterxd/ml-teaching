import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { DialogFooter } from '../ui/dialog';

export default function SetupActionFooter({
  children,
  stacked = false,
}: {
  children: ReactNode;
  stacked?: boolean;
}) {
  return (
    <DialogFooter
      className={cn(
        'flex flex-col [&_[data-slot=button]]:h-auto [&_[data-slot=button]]:min-h-9 [&_[data-slot=button]]:min-w-0 [&_[data-slot=button]]:grow [&_[data-slot=button]]:wrap-anywhere [&_[data-slot=button]]:whitespace-normal',
        !stacked &&
          '@min-[32rem]/training-setup:flex-row @min-[32rem]/training-setup:flex-wrap @min-[32rem]/training-setup:gap-2 @min-[32rem]/training-setup:[&_[data-slot=button]]:px-3',
      )}
    >
      {children}
    </DialogFooter>
  );
}
