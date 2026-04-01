/**
 * PageLayout.tsx
 *
 * Shared page layout wrapper that applies consistent background color, typography,
 * and spacing across all pages. Exported as the default layout component.
 */
import type { ReactNode } from 'react';

/**
 * Props for the PageLayout component.
 */
interface PageLayoutProps {
  /** The page content to render inside the layout container. */
  children: ReactNode;
}

/**
 * Wraps page content in a full-height container with base Tailwind styles:
 * zinc-50 background, zinc-900 text, sans-serif font, bottom padding,
 * automatic hyphenation, and word-break handling.
 *
 * @param children - The page content to render.
 */
export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-20 hyphens-auto break-words">
      {children}
    </div>
  );
}
