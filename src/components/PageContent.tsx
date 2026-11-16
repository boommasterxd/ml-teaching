import type { ReactNode } from 'react';

/** Controlled legal copy uses one central typography system in both themes. */
export default function PageContent({
  id,
  labelledBy,
  children,
}: {
  id?: string;
  labelledBy?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className="legal-section">
      <article className="legal-content">{children}</article>
    </section>
  );
}
