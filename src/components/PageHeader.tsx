import type { ReactNode } from 'react';
import { ArrowLeft } from './icons';
import AnimatedLink from './AnimatedLink';

/** Local navigation remains below the persistent global header. */
export default function PageHeader({ title, rightSlot }: { title: string; rightSlot?: ReactNode }) {
  return (
    <div className="page-header">
      <nav aria-label="Seitennavigation">
        <AnimatedLink href="/" variant="navigation" size="text" aria-label="Zurück zur Startseite">
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          <span>Zurück</span>
        </AnimatedLink>
      </nav>
      <p className="page-header-title">{title}</p>
      {rightSlot}
    </div>
  );
}
