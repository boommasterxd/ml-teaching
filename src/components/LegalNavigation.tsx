import { Accessibility, Gavel, LockKeyhole } from 'lucide-react';
import { headerLegalLinks } from '@/content/site-navigation';
import LegalMobileNavigation from './LegalMobileNavigation';
import LegalBackLink from './LegalBackLink';
import LegalDesktopNavigation from './LegalDesktopNavigation';
import type { LegalPage } from './LegalNavigationLinks';
import IntentLink from './IntentLink';
import { buttonVariants } from './button-variants';
import { Card } from './ui/card';
import { Text } from './ui/typography';
import { EntryReveal } from './ui/entry-reveal';

export type { LegalPage } from './LegalNavigationLinks';

const staticIcons = { imprint: Gavel, privacy: LockKeyhole, accessibility: Accessibility };

function InitialLegalLinks({ page }: { page: LegalPage }) {
  return (
    <ul className="flex list-none flex-col gap-1">
      {headerLegalLinks.map(({ id, href, label }) => {
        const Icon = staticIcons[id];
        return (
          <li key={id}>
            <IntentLink
              href={href}
              aria-current={page === id ? 'page' : undefined}
              className={buttonVariants({ variant: 'ghost', className: 'legal-page-link' })}
              data-slot="button"
            >
              <Icon data-icon="inline-start" aria-hidden="true" />
              {label}
            </IntentLink>
          </li>
        );
      })}
    </ul>
  );
}

export default function LegalNavigation({ page }: { page: LegalPage }) {
  return (
    <EntryReveal kind="navigation" asChild>
      <aside className="legal-sidebar">
        <LegalBackLink />
        <LegalMobileNavigation selectedValue={page} />
        <div className="legal-navigation-group">
          <Text variant="muted">Informationen</Text>
          <Card as="nav" aria-label="Informationsseiten" className="legal-navigation">
            <LegalDesktopNavigation page={page}>
              <InitialLegalLinks page={page} />
            </LegalDesktopNavigation>
          </Card>
        </div>
      </aside>
    </EntryReveal>
  );
}
