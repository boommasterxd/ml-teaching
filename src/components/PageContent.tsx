/**
 * Centered content card used by legal / informational pages (privacy, imprint, etc.).
 */
import type { ReactNode } from 'react';

/** Props for the PageContent component. */
interface PageContentProps {
  /** Optional HTML id applied to the wrapping `<section>` element. */
  id?: string;
  /** Value passed to `aria-labelledby` for accessible section labelling. */
  labelledBy?: string;
  /** Content rendered inside the styled card. */
  children: ReactNode;
}

/**
 * Renders a white card section with constrained width and prose typography.
 *
 * @param id - Optional HTML id for the `<section>` element.
 * @param labelledBy - Id of the element that labels this section (`aria-labelledby`).
 * @param children - Content to display inside the card.
 * @returns A styled `<section>` containing a rounded card with prose styles applied.
 */
export default function PageContent({ id, labelledBy, children }: PageContentProps) {
  return (
    <section
      id={id}
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12"
      aria-labelledby={labelledBy}
    >
      <div className="bg-white p-6 sm:p-12 rounded-3xl border border-zinc-200 shadow-sm prose prose-zinc max-w-none">
        {children}
      </div>
    </section>
  );
}
