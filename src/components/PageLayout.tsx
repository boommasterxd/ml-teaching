import type { ReactNode } from 'react';
import LegalNavigation, { type LegalPage } from './LegalNavigation';

/** Shared legal reading layout beneath the persistent site shell. */
export default function PageLayout({ children, page }: { children: ReactNode; page: LegalPage }) {
  return (
    <div className="page-layout legal-layout">
      <LegalNavigation page={page} />
      {children}
    </div>
  );
}
