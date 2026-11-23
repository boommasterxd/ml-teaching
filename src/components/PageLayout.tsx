import type { ReactNode } from 'react';
import type { LegalPage } from '@/content/site-navigation';
import LegalNavigation from './LegalNavigation';
import './legal.css';

/** Shared legal reading layout beneath the persistent site shell. */
export default function PageLayout({ children, page }: { children: ReactNode; page: LegalPage }) {
  return (
    <div className="page-layout legal-layout">
      <LegalNavigation page={page} />
      {children}
    </div>
  );
}
