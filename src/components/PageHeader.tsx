import type { ReactNode } from 'react';
import { ArrowLeft } from './icons/arrow-left';
import AnimatedLink from './AnimatedLink';
import { EntryReveal } from './ui/entry-reveal';

/** Local navigation remains below the persistent global header. */
export default function PageHeader({ title, rightSlot }: { title: string; rightSlot?: ReactNode }) {
  return (
    <EntryReveal kind="navigation" asChild>
      <div className="page-header">
        <nav aria-label="Seitennavigation">
          <AnimatedLink
            href="/"
            transitionTypes={['nav-back']}
            variant="link"
            size="sm"
            aria-label="Zurück zur Startseite"
          >
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            <span>Zurück</span>
          </AnimatedLink>
        </nav>
        <p className="page-header-title">{title}</p>
        {rightSlot}
      </div>
    </EntryReveal>
  );
}
