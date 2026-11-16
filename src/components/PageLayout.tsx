import type { ReactNode } from 'react';

/** Shared inner-page spacing beneath the persistent site shell. */
export default function PageLayout({ children }: { children: ReactNode }) {
  return <div className="page-layout">{children}</div>;
}
