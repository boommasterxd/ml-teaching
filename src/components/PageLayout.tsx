/**
 * Shared page layout wrapper providing consistent background, typography, and spacing.
 */
import type { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
}

/** Wraps page content in a full-height container with base styles. */
export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-20 hyphens-auto break-words">
      {children}
    </div>
  );
}
